import { Payload } from "mzinga";
import { MZingaLogger } from "../utils/MZingaLogger";

export class MailUtils {
  static async sendMail(payload: Payload, message: any) {
    if (process.env.DEBUG_EMAIL_SEND === "1") {
      MZingaLogger.Instance?.info(
        "[MailUtils:message] %s",
        JSON.stringify(message, null, 2)
      );
    }
    const email = await payload.email;
    const result = await email.transport.sendMail(message);
    if (process.env.DEBUG_EMAIL_SEND === "1") {
      MZingaLogger.Instance?.info(
        "[MailUtils:result] %s",
        JSON.stringify(result, null, 2)
      );
    }
    return result;
  }
}
