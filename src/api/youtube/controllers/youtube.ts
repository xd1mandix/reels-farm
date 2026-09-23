import { google } from "googleapis";

export const createOAuthClient = () =>
  new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );


export default {
  async connect(ctx) {
    const oauth = createOAuthClient()
    const url = oauth.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: [
        "https://www.googleapis.com/auth/youtube",
      ],
    });

    console.log("[auth started][youtube]")

    ctx.redirect(url);
  },

  async callback(ctx) {
    const code = Array.isArray(ctx.query.code)
      ? ctx.query.code[0]
      : ctx.query.code

    if (!code) {
      return ctx.badRequest("No authorization code");
    }

    const oauth = createOAuthClient()

    const tokensRes = await oauth.getToken(code);

    const tokens = tokensRes.tokens
    console.log("[got token][youtube]")

    oauth.setCredentials(tokens)

    const youtube = google.youtube({
      version: "v3",
      auth: oauth,
    });

    const me = await youtube.channels.list({
      part: ["snippet"],
      mine: true,
    });

    const channel = me.data.items?.[0];

    console.log("[authentificated][youtube]")

    await strapi.documents("api::account.account").create({
      data: {
        platform: 'youtube',
        name: channel.snippet.title,
        link: channel.snippet.customUrl,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(tokens.expiry_date),
      },
    });

    ctx.body = "YouTube connected";
  }
};

// вызывается при каждой загрузке нового видео
export async function refreshAccessToken(account) {
  const oauth = createOAuthClient();

  oauth.setCredentials({
    refresh_token: account.refreshToken,
  });

  const { credentials } = await oauth.refreshAccessToken();

  await strapi.documents("api::account.account").update({
    documentId: account.documentId,
    data: {
      accessToken: credentials.access_token!,
      expiresAt: new Date(credentials.expiry_date!),
    },
  });

  return credentials;
}

