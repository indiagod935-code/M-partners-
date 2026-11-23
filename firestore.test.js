const {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} = require("@firebase/rules-unit-testing");
const { test, before, after, beforeEach } = require("node:test");
const fs = require("node:fs");

let testEnv;
const PROJECT_ID = process.env.GCP_PROJECT || "demo-no-project";
const ALICE_UID = "alice_uid_123";
const BOB_UID = "bob_uid_456";
const ADMIN_EMAIL = "rp2824173@gmail.com";

const [emulatorHost, emulatorPortStr] = (process.env.FIRESTORE_EMULATOR_HOST || "127.0.0.1:8085").split(":");
const emulatorPort = parseInt(emulatorPortStr, 10);

before(async () => {
  const rules = fs.readFileSync("./firestore.rules", "utf8");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules,
      host: emulatorHost,
      port: emulatorPort,
    },
  });
});

after(async () => {
  if (testEnv) {
    await testEnv.cleanup();
  }
});

beforeEach(async () => {
  if (testEnv) {
    await testEnv.clearFirestore();
  }
});

test("Unauthenticated users cannot read or write deliveryRequests or users", async () => {
  const unauthDb = testEnv.unauthenticatedContext().firestore();
  await assertFails(unauthDb.collection("deliveryRequests").get());
  await assertFails(
    unauthDb.collection("deliveryRequests").doc("req_1").set({
      userId: ALICE_UID,
      customerName: "Aarav",
      itemsText: "1L Milk, Bread",
      status: "order_placed",
      createdAt: new Date(Date.now() - 1000),
      updatedAt: new Date(Date.now() - 1000),
    })
  );
  await assertFails(unauthDb.collection("users").doc(ALICE_UID).get());
});

test("Owner can create, query, edit while order_placed, and cancel deliveryRequest matching Kotlin payloads", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const created = new Date(Date.now() - 10000);

  await assertSucceeds(
    aliceDb.collection("deliveryRequests").doc("req_1").set({
      userId: ALICE_UID,
      customerName: "Aarav Sharma",
      customerEmail: "aarav@example.com",
      itemsText: "1L Amul Taaza Milk, 1 Brown Bread",
      deliveryAddress: "Flat 302, Sai Krupa Heights, Khuntavli",
      preferredTime: "ASAP (Within 45 mins)",
      notes: "Check expiry date",
      status: "order_placed",
      deliveryOtp: "4821",
      estimatedTotalInr: 120,
      createdAt: created,
      updatedAt: created,
    })
  );

  // Scoped query succeeds; unfiltered query fails
  await assertSucceeds(
    aliceDb.collection("deliveryRequests").where("userId", "==", ALICE_UID).get()
  );
  await assertFails(aliceDb.collection("deliveryRequests").get());

  // Edit itemsText while order_placed
  await assertSucceeds(
    aliceDb.collection("deliveryRequests").doc("req_1").update({
      itemsText: "1L Amul Taaza Milk, 1 Brown Bread, 250g Paneer",
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Cancel deliveryRequest
  await assertSucceeds(
    aliceDb.collection("deliveryRequests").doc("req_1").update({
      status: "cancelled",
      updatedAt: new Date(Date.now() - 500),
    })
  );

  // Terminal state locking: cannot re-edit or re-open after cancelled
  await assertFails(
    aliceDb.collection("deliveryRequests").doc("req_1").update({
      status: "order_placed",
      updatedAt: new Date(Date.now() - 200),
    })
  );
});

test("Security bounds reject cross-user access, extra @DocumentId 'id', ghost fields, and spoofed admin email", async () => {
  const aliceDb = testEnv.authenticatedContext(ALICE_UID).firestore();
  const bobDb = testEnv.authenticatedContext(BOB_UID).firestore();
  const spoofedAdminDb = testEnv.authenticatedContext("spoof_1", {
    email: ADMIN_EMAIL,
    email_verified: false,
  }).firestore();
  const created = new Date(Date.now() - 10000);

  await assertSucceeds(
    aliceDb.collection("deliveryRequests").doc("req_alice").set({
      userId: ALICE_UID,
      customerName: "Aarav",
      itemsText: "2kg Basmati Rice",
      status: "order_placed",
      createdAt: created,
      updatedAt: created,
    })
  );

  // Cross-user access denied
  await assertFails(bobDb.collection("deliveryRequests").doc("req_alice").get());
  await assertFails(
    bobDb.collection("deliveryRequests").where("userId", "==", ALICE_UID).get()
  );
  await assertFails(
    bobDb.collection("deliveryRequests").doc("req_alice").update({
      status: "cancelled",
      updatedAt: new Date(Date.now() - 1000),
    })
  );

  // Reject @DocumentId 'id' inside payload and ghost fields
  await assertFails(
    aliceDb.collection("deliveryRequests").doc("req_bad_id").set({
      id: "req_bad_id",
      userId: ALICE_UID,
      customerName: "Aarav",
      itemsText: "Milk",
      status: "order_placed",
      createdAt: created,
      updatedAt: created,
    })
  );
  await assertFails(
    aliceDb.collection("users").doc(ALICE_UID).set({
      userId: ALICE_UID,
      displayName: "Aarav",
      role: "admin",
      createdAt: created,
      updatedAt: created,
    })
  );

  // Unverified email spoof rejected
  await assertFails(spoofedAdminDb.collection("deliveryRequests").doc("req_alice").get());
});
