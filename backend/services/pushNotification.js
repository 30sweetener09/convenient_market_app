import { firebaseAdmin } from "./firebase.js";

export const pushNotification = async ({
  token,
  title,
  body,
  data = {},
}) => {
  return firebaseAdmin.messaging().send({
    token,
    notification: { title, body },
    data,
  });
};
