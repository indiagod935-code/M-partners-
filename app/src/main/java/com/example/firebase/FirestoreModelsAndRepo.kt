package com.example.firebase

import android.content.Context
import android.util.Log
import androidx.annotation.Keep
import com.example.R
import com.google.firebase.Firebase
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.auth
import com.google.firebase.firestore.DocumentId
import com.google.firebase.firestore.DocumentSnapshot
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.FirebaseFirestoreException
import com.google.firebase.firestore.IgnoreExtraProperties
import com.google.firebase.firestore.ServerTimestamp
import com.google.firebase.firestore.snapshots
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.emitAll
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.tasks.await
import org.json.JSONArray
import org.json.JSONObject
import kotlin.random.Random

enum class OperationType(val value: String) {
    CREATE("create"),
    UPDATE("update"),
    DELETE("delete"),
    LIST("list"),
    GET("get"),
    WRITE("write"),
}

fun handleFirestoreError(exception: Throwable, operationType: OperationType, path: String?): String {
    val causes = generateSequence(exception) { it.cause }
    val rootError = causes.firstOrNull { it is FirebaseFirestoreException }
        ?: causes.firstOrNull { it !is CancellationException }
        ?: exception

    val currentUser = Firebase.auth.currentUser
    val providerInfoList = currentUser?.providerData?.map { provider ->
        JSONObject().apply {
            put("providerId", provider.providerId)
            put("email", provider.email)
        }
    } ?: emptyList()

    val authInfoJson = JSONObject().apply {
        put("userId", currentUser?.uid)
        put("email", currentUser?.email)
        put("emailVerified", currentUser?.isEmailVerified)
        put("tenantId", currentUser?.tenantId)
        put("providerInfo", JSONArray(providerInfoList))
    }

    val errorInfoJson = JSONObject().apply {
        put("error", rootError.message ?: rootError.toString())
        put("operationType", operationType.value)
        put("path", path)
        put("authInfo", authInfoJson)
    }

    val jsonString = errorInfoJson.toString()
    Log.e("FirestoreError", "Firestore Error: $jsonString")
    return jsonString
}

@Keep
@IgnoreExtraProperties
data class UserProfileDoc(
    @DocumentId val id: String = "",
    val userId: String = "",
    val displayName: String = "",
    val email: String = "",
    val locality: String = "",
    val role: String = "customer",
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

@Keep
@IgnoreExtraProperties
data class DeliveryRequest(
    @DocumentId val id: String = "",
    val userId: String = "",
    val customerName: String = "",
    val customerEmail: String = "",
    val itemsText: String = "",
    val deliveryAddress: String = "",
    val preferredTime: String = "ASAP (Within 45 mins)",
    val notes: String = "",
    val status: String = "order_placed",
    val deliveryOtp: String = "",
    val estimatedTotalInr: Double = 0.0,
    @ServerTimestamp val createdAt: Timestamp? = null,
    @ServerTimestamp val updatedAt: Timestamp? = null
)

class FirestoreDeliveryRepository(
    private val db: FirebaseFirestore,
    private val auth: FirebaseAuth = Firebase.auth
) {
    constructor(context: Context) : this(
        FirebaseFirestore.getInstance(
            context.applicationContext.getString(R.string.firestore_database_id)
        )
    )

    private fun requireUserId(): String {
        return auth.currentUser?.uid?.takeIf { it.isNotBlank() }
            ?: throw IllegalStateException("Please sign in with Google before accessing Firestore.")
    }

    suspend fun syncUserProfile(
        displayName: String,
        email: String,
        locality: String
    ): Result<Unit> {
        var docPath = "users/unauthenticated"
        return try {
            val uid = requireUserId()
            val safeName = displayName.trim().ifBlank { "M-PARTNER Customer" }.take(100)
            val safeEmail = email.trim().take(150)
            val safeLocality = locality.trim().ifBlank { "Ambarnath (West)" }.take(150)
            val docRef = db.collection("users").document(uid)
            docPath = docRef.path

            val existing = docRef.get().await()
            if (existing.exists()) {
                docRef.update(
                    mapOf(
                        "displayName" to safeName,
                        "email" to safeEmail,
                        "locality" to safeLocality,
                        "updatedAt" to FieldValue.serverTimestamp()
                    )
                ).await()
            } else {
                val payload = mapOf(
                    "userId" to uid,
                    "displayName" to safeName,
                    "email" to safeEmail,
                    "locality" to safeLocality,
                    "role" to "customer",
                    "createdAt" to FieldValue.serverTimestamp(),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
                docRef.set(payload).await()
            }
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.WRITE, docPath)
            Result.failure(e)
        }
    }

    fun observeMyDeliveryRequests(userId: String): Flow<List<DeliveryRequest>> = flow {
        val uid = userId.takeIf { it.isNotBlank() } ?: requireUserId()
        val path = "deliveryRequests"
        emitAll(
            db.collection(path)
                .whereEqualTo("userId", uid)
                .snapshots()
                .map { snapshot ->
                    snapshot.toObjects(
                        DeliveryRequest::class.java,
                        DocumentSnapshot.ServerTimestampBehavior.ESTIMATE
                    ).sortedByDescending { it.createdAt ?: Timestamp(0, 0) }
                }
                .catch { error ->
                    val firestoreError = generateSequence(error) { it.cause }
                        .filterIsInstance<FirebaseFirestoreException>()
                        .firstOrNull()
                    if (firestoreError == null && error is CancellationException) throw error
                    val exceptionToLog = firestoreError ?: (error as? Exception)
                    if (exceptionToLog != null && auth.currentUser?.uid == uid) {
                        handleFirestoreError(exceptionToLog, OperationType.LIST, path)
                    }
                    throw error
                }
        )
    }

    suspend fun submitDeliveryRequest(
        itemsText: String,
        deliveryAddress: String,
        preferredTime: String,
        notes: String,
        estimatedTotalInr: Double = 0.0
    ): Result<String> {
        var docPath = "deliveryRequests"
        return try {
            val user = auth.currentUser
                ?: throw IllegalStateException("Please sign in with Google before saving to Firestore.")
            val uid = user.uid.takeIf { it.isNotBlank() }
                ?: throw IllegalStateException("Invalid user session.")

            val cleanedItems = itemsText.trim()
            require(cleanedItems.isNotEmpty() && cleanedItems.length <= 2000) {
                "Please enter at least 1 item (up to 2000 characters)."
            }
            val cleanedName = (user.displayName ?: user.email?.substringBefore("@") ?: "M-PARTNER Customer")
                .trim()
                .take(100)
                .ifBlank { "M-PARTNER Customer" }
            val cleanedAddress = deliveryAddress.trim().take(300)
            val cleanedTime = preferredTime.trim().ifBlank { "ASAP (Within 45 mins)" }.take(100)
            val cleanedNotes = notes.trim().take(500)
            val otp = Random.nextInt(1000, 9999).toString()

            val docRef = db.collection("deliveryRequests").document()
            docPath = docRef.path

            val payload = buildMap<String, Any> {
                put("userId", uid)
                put("customerName", cleanedName)
                user.email?.trim()?.takeIf { it.isNotBlank() }?.let { put("customerEmail", it.take(150)) }
                put("itemsText", cleanedItems)
                if (cleanedAddress.isNotEmpty()) put("deliveryAddress", cleanedAddress)
                put("preferredTime", cleanedTime)
                if (cleanedNotes.isNotEmpty()) put("notes", cleanedNotes)
                put("status", "order_placed")
                put("deliveryOtp", otp)
                put("estimatedTotalInr", estimatedTotalInr.coerceIn(0.0, 100000.0))
                put("createdAt", FieldValue.serverTimestamp())
                put("updatedAt", FieldValue.serverTimestamp())
            }

            docRef.set(payload).await()
            Result.success(docRef.id)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.CREATE, docPath)
            Result.failure(e)
        }
    }

    suspend fun updateDeliveryRequestItems(
        requestId: String,
        itemsText: String,
        deliveryAddress: String,
        notes: String
    ): Result<Unit> {
        var docPath = "deliveryRequests/$requestId"
        return try {
            requireUserId()
            require(requestId.isNotBlank()) { "Request ID cannot be blank" }
            val cleanedItems = itemsText.trim()
            require(cleanedItems.isNotEmpty() && cleanedItems.length <= 2000) {
                "Items list must be 1 to 2000 characters."
            }

            val docRef = db.collection("deliveryRequests").document(requestId)
            docPath = docRef.path
            docRef.update(
                mapOf(
                    "itemsText" to cleanedItems,
                    "deliveryAddress" to deliveryAddress.trim().take(300),
                    "notes" to notes.trim().take(500),
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, docPath)
            Result.failure(e)
        }
    }

    suspend fun cancelDeliveryRequest(requestId: String): Result<Unit> {
        var docPath = "deliveryRequests/$requestId"
        return try {
            requireUserId()
            require(requestId.isNotBlank()) { "Request ID cannot be blank" }
            val docRef = db.collection("deliveryRequests").document(requestId)
            docPath = docRef.path
            docRef.update(
                mapOf(
                    "status" to "cancelled",
                    "updatedAt" to FieldValue.serverTimestamp()
                )
            ).await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.UPDATE, docPath)
            Result.failure(e)
        }
    }

    suspend fun deleteDeliveryRequest(requestId: String): Result<Unit> {
        var docPath = "deliveryRequests/$requestId"
        return try {
            requireUserId()
            require(requestId.isNotBlank()) { "Request ID cannot be blank" }
            val docRef = db.collection("deliveryRequests").document(requestId)
            docPath = docRef.path
            docRef.delete().await()
            Result.success(Unit)
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            handleFirestoreError(e, OperationType.DELETE, docPath)
            Result.failure(e)
        }
    }
}
