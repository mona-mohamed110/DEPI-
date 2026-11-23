const AccessLog = require("../models/AccessLog");

const ACTION_LABELS = {
  viewed_file: { ar: "اطلع على الملف الطبي", en: "Viewed the medical file" },
  added_prescription: { ar: "أضاف روشتة جديدة", en: "Added a new prescription" },
  uploaded_result: { ar: "رفع نتيجة تحليل", en: "Uploaded a lab result" },
  granted_access: { ar: "مُنح إذن الاطلاع", en: "Was granted access" },
  revoked_access: { ar: "أُلغي إذن الاطلاع", en: "Access was revoked" },
};

// التسجيل لا يجب أن يكسر الطلب الأساسي أبداً
async function logAccess(patientId, actor, action, refId) {
  try {
    if (!patientId || !ACTION_LABELS[action]) return;
    await AccessLog.create({
      patientId,
      actorId: actor && actor._id ? actor._id : null,
      actorName: (actor && actor.name) || "",
      action,
      refId: refId || null,
    });
  } catch (error) {
    console.error("Access log error:", error.message);
  }
}

module.exports = { logAccess, ACTION_LABELS };
