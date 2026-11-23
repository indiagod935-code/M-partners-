package com.example.data

import android.util.Log
import com.example.model.SmartListItem
import com.example.model.SmartListResult
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.Schema
import com.google.firebase.ai.type.content
import com.google.firebase.ai.type.generationConfig
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.withTimeout
import org.json.JSONObject

private const val TAG = "AiShoppingRepository"

class AiShoppingRepository {

    private val smartListSchema = Schema.obj(
        properties = mapOf(
            "summary" to Schema.string("Short 1-sentence summary of the shopping order"),
            "items" to Schema.array(
                items = Schema.obj(
                    properties = mapOf(
                        "id" to Schema.string("Sequential ID string"),
                        "name" to Schema.string("Standardized product name"),
                        "quantity" to Schema.string("Quantity with unit e.g. 500g, 1L, 2 packs"),
                        "category" to Schema.string("Dairy, Produce, Spices, Snacks, Pharmacy, or Household"),
                        "estimatedPriceInr" to Schema.double("Realistic estimated INR price"),
                        "storeType" to Schema.string("Local shop type e.g. Kirana Store, Dairy, Pharmacy")
                    )
                ),
                description = "Structured list of shopping items"
            ),
            "totalEstimatedPrice" to Schema.double("Sum of estimated INR prices"),
            "suggestedStores" to Schema.array(
                items = Schema.string(),
                description = "Recommended neighborhood store types"
            ),
            "runnerInstructions" to Schema.string("Helpful shopping tip for the designated local Runner")
        )
    )

    private val structuredListModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                temperature = 0.2f
                responseMimeType = "application/json"
                responseSchema = smartListSchema
            },
            systemInstruction = content {
                text(
                    """
                    You are the AI Shopping Assistant for M-PARTNER (Powered by Mãrçò 💯).
                    The customer gives a rough shopping request, recipe idea, or messy text notes.
                    Parse it into a clean, structured JSON object with realistic Indian Rupee (INR ₹) estimated prices
                    for an Indian neighborhood market (Ambarnath / Thane district context).
                    """.trimIndent()
                )
            }
        )
    }

    private val conciergeModel by lazy {
        Firebase.ai.generativeModel(
            modelName = "gemini-3.8-flash",
            generationConfig = generationConfig {
                temperature = 0.4f
            },
            systemInstruction = content {
                text(
                    """
                    You are M-PARTNER's friendly, efficient AI concierge (Powered by Mãrçò 💯).
                    Key platform facts:
                    - Platform: M-PARTNER
                    - Parent Brand: Mãrçò 💯
                    - Tagline: Your Needs. Your Trusted Partner.
                    - Model: Subscription-based local shopping assistance with a dedicated neighborhood Runner.
                    - Delivery allowance comes from Subscription Credits (Starter ₹200/20 credits, Standard ₹400/40 credits, Plus ₹600/60 credits, Premium ₹800/80 credits, Pro ₹1000/100 credits; all valid 30 days).
                    - Samaan (groceries/items) are paid transparently from the customer's Shopping Wallet balance after Runner verification.
                    - Every delivery is secured by a 4-digit Delivery OTP.
                    Answer clearly, concisely, and warmly in the user's language (English, Hindi, Marathi, or Hinglish).
                    """.trimIndent()
                )
            }
        )
    }

    suspend fun generateSmartList(prompt: String): SmartListResult {
        try {
            val response = withTimeout(60_000L) {
                structuredListModel.generateContent("Customer shopping request: \"$prompt\"")
            }
            val jsonText = response.text ?: throw IllegalStateException("Gemini returned an empty response.")
            val json = JSONObject(jsonText)
            val summary = json.optString("summary", "Structured shopping list")
            val totalEst = json.optDouble("totalEstimatedPrice", 0.0)
            val runnerInstructions = json.optString(
                "runnerInstructions",
                "Verify freshness and confirm store receipt before delivery."
            )

            val storesJson = json.optJSONArray("suggestedStores")
            val suggestedStores = mutableListOf<String>()
            if (storesJson != null) {
                for (i in 0 until storesJson.length()) {
                    suggestedStores.add(storesJson.optString(i))
                }
            }

            val itemsJson = json.optJSONArray("items")
            val items = mutableListOf<SmartListItem>()
            if (itemsJson != null) {
                for (i in 0 until itemsJson.length()) {
                    val obj = itemsJson.getJSONObject(i)
                    items.add(
                        SmartListItem(
                            id = obj.optString("id", "${i + 1}"),
                            name = obj.optString("name", "Item"),
                            quantity = obj.optString("quantity", "1 pack"),
                            category = obj.optString("category", "Grocery"),
                            estimatedPriceInr = obj.optDouble("estimatedPriceInr", 50.0),
                            storeType = obj.optString("storeType", "Local Store")
                        )
                    )
                }
            }

            return SmartListResult(
                summary = summary,
                items = items,
                totalEstimatedPrice = if (totalEst > 0) totalEst else items.sumOf { it.estimatedPriceInr },
                suggestedStores = suggestedStores.ifEmpty { listOf("Local Kirana Store") },
                runnerInstructions = runnerInstructions
            )
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "Smart list generation timed out", e)
            throw IllegalStateException("AI request timed out after 60 seconds. Please try again.")
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "Smart list generation failed", e)
            throw e
        }
    }

    fun streamConciergeResponse(question: String, userContextSummary: String): Flow<String> = flow {
        val accumulated = StringBuilder()
        try {
            withTimeout(60_000L) {
                val fullPrompt = if (userContextSummary.isNotBlank()) {
                    "User Question: \"$question\"\nCustomer Context: $userContextSummary"
                } else {
                    "User Question: \"$question\""
                }
                conciergeModel.generateContentStream(fullPrompt).collect { chunk ->
                    val chunkText = chunk.text.orEmpty()
                    if (chunkText.isNotEmpty()) {
                        accumulated.append(chunkText)
                        emit(accumulated.toString())
                    }
                }
            }
            if (accumulated.isBlank()) {
                throw IllegalStateException("AI concierge returned an empty response.")
            }
        } catch (e: TimeoutCancellationException) {
            Log.e(TAG, "AI concierge timed out", e)
            throw IllegalStateException("AI concierge timed out after 60 seconds. Please try again.")
        } catch (e: CancellationException) {
            throw e
        } catch (e: Exception) {
            Log.e(TAG, "AI concierge streaming failed", e)
            throw e
        }
    }
}
