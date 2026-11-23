package com.example.ui

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.firebase.DeliveryRequest
import com.example.firebase.FirestoreDeliveryRepository
import com.google.firebase.firestore.FirebaseFirestoreException
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

private const val VM_TAG = "FirestoreDeliveryVM"

sealed interface FirestoreUiState<out T> {
    data object Loading : FirestoreUiState<Nothing>
    data class Success<T>(val data: T) : FirestoreUiState<T>
    data class Error(val message: String) : FirestoreUiState<Nothing>
}

class FirestoreDeliveryViewModel(
    private val repository: FirestoreDeliveryRepository,
    private val currentUserId: String,
    private val displayName: String,
    private val email: String
) : ViewModel() {

    val requestsState: StateFlow<FirestoreUiState<List<DeliveryRequest>>> =
        repository.observeMyDeliveryRequests(currentUserId)
            .map<List<DeliveryRequest>, FirestoreUiState<List<DeliveryRequest>>> {
                FirestoreUiState.Success(it)
            }
            .catch { error ->
                val firestoreError = generateSequence(error) { it.cause }
                    .filterIsInstance<FirebaseFirestoreException>()
                    .firstOrNull()
                if (firestoreError == null && error is CancellationException) throw error
                val rootError = firestoreError ?: error
                Log.w(VM_TAG, "Error observing deliveryRequests", rootError)
                emit(FirestoreUiState.Error(rootError.localizedMessage ?: "Failed to load delivery requests"))
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000L),
                initialValue = FirestoreUiState.Loading
            )

    private val _isSubmitting = MutableStateFlow(false)
    val isSubmitting: StateFlow<Boolean> = _isSubmitting.asStateFlow()

    private val _statusEvent = MutableSharedFlow<String>(extraBufferCapacity = 8)
    val statusEvent: SharedFlow<String> = _statusEvent.asSharedFlow()

    init {
        viewModelScope.launch {
            repository.syncUserProfile(
                displayName = displayName,
                email = email,
                locality = "Ambarnath (West)"
            )
        }
    }

    fun submitRequest(
        itemsText: String,
        deliveryAddress: String,
        preferredTime: String,
        notes: String,
        estimatedTotalInr: Double = 0.0,
        onSuccess: () -> Unit = {}
    ) {
        if (_isSubmitting.value) return
        viewModelScope.launch {
            _isSubmitting.value = true
            try {
                repository.submitDeliveryRequest(
                    itemsText = itemsText,
                    deliveryAddress = deliveryAddress,
                    preferredTime = preferredTime,
                    notes = notes,
                    estimatedTotalInr = estimatedTotalInr
                ).onSuccess {
                    _statusEvent.tryEmit("Delivery request saved to Firestore!")
                    onSuccess()
                }.onFailure { err ->
                    _statusEvent.tryEmit(err.localizedMessage ?: "Could not save delivery request.")
                }
            } finally {
                _isSubmitting.value = false
            }
        }
    }

    fun updateRequest(
        requestId: String,
        itemsText: String,
        deliveryAddress: String,
        notes: String
    ) {
        viewModelScope.launch {
            repository.updateDeliveryRequestItems(requestId, itemsText, deliveryAddress, notes)
                .onSuccess { _statusEvent.tryEmit("Delivery request updated.") }
                .onFailure { _statusEvent.tryEmit(it.localizedMessage ?: "Failed to update request.") }
        }
    }

    fun cancelRequest(requestId: String) {
        viewModelScope.launch {
            repository.cancelDeliveryRequest(requestId)
                .onSuccess { _statusEvent.tryEmit("Delivery request cancelled.") }
                .onFailure { _statusEvent.tryEmit(it.localizedMessage ?: "Failed to cancel request.") }
        }
    }

    fun deleteRequest(requestId: String) {
        viewModelScope.launch {
            repository.deleteDeliveryRequest(requestId)
                .onSuccess { _statusEvent.tryEmit("Delivery request deleted.") }
                .onFailure { _statusEvent.tryEmit(it.localizedMessage ?: "Failed to delete request.") }
        }
    }
}
