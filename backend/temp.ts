// import { FastifyInstance } from "fastify";
// import { logAudit } from "../../../../utils/audit";
// import { handleAttendanceEvent } from "./webhook-event.handler";
// import { normalizeEvent } from "./webhook-event.prepare";
// import { persistWebhookPicture } from "./webhook.routes.helpers";
// import { extractWebhookPayload } from "./webhook.routes.parser";
// import { enforceWebhookSecret, logWebhookDebugEvent, logWebhookDebugNormalized, logWebhookDebugStart, logWebhookMissingSchool, resolveSchool } from "./webhook.routes.school";

// export default async function (fastify: FastifyInstance) {
//   fastify.addContentTypeParser(
//     "application/json",
//     { parseAs: "string" },
//     (req, body, done) => {
//       try {
//         done(null, JSON.parse(body as string));
//       } catch (err: any) {
//         done(err, undefined);
//       }
//     },
//   );

//   fastify.post(
//     "/webhook/:schoolId/:direction",
//     { logLevel: "warn" },
//     async (request: any, reply) => {
//     const params = request.params as { schoolId: string; direction: string };
//     if (!["in", "out"].includes(params.direction)) {
//       return reply.status(400).send({ error: "Invalid direction" });
//     }

//     const school = await resolveSchool(params.schoolId);
//     if (!school) {
//       logWebhookMissingSchool(params.schoolId);
//       return reply.status(404).send({ error: "School not found" });
//     }

//     logWebhookDebugStart(request, school, params.direction);

//     const secretError = enforceWebhookSecret(request, params.direction, school);
//     if (secretError) {
//       return reply.status(403).send(secretError);
//     }

//     let accessEventJson: any = null;
//     let picture: any = null;

//     try {
//       const extracted = await extractWebhookPayload(request);
//       accessEventJson = extracted.accessEventJson;
//       picture = extracted.picture;
//     } catch (err) {
//       console.error("Parse error:", err);
//       return reply
//         .status(400)
//         .send({ error: "Parse failed", msg: String(err) });
//     }

//     if (!accessEventJson) {
//       console.log("No AccessControllerEvent found");
//       return reply.status(400).send({ error: "Missing AccessControllerEvent" });
//     }

//     logWebhookDebugEvent({
//       schoolId: params.schoolId,
//       direction: params.direction,
//       accessEventJson,
//     });

//     const normalized = normalizeEvent(accessEventJson);
//     if (!normalized) {
//       logAudit(fastify, {
//         action: "webhook.request.invalid",
//         level: "warn",
//         message: "Event notoâ€˜gâ€˜ri formatda kelgan",
//         schoolId: school.id,
//         extra: { direction: params.direction },
//       });
//       return reply.send({ ok: true, ignored: true });
//     }

//     logAudit(fastify, {
//       action: "webhook.request.received",
//       level: "info",
//       message: "Webhook voqeasi qabul qilindi",
//       schoolId: school.id,
//       extra: {
//         direction: params.direction,
//         employeeNoString: normalized.employeeNoString,
//         deviceID: normalized.deviceID,
//         dateTime: normalized.dateTime,
//       },
//     });

//     logWebhookDebugNormalized(normalized);

//     const savedPicturePath = await persistWebhookPicture(picture);

//     const result = await handleAttendanceEvent(
//       school,
//       params.direction,
//       accessEventJson,
//       savedPicturePath,
//       { fastify, request, normalizedEvent: normalized },
//     );

//     return reply.send(result);
//     },
//   );
// }
