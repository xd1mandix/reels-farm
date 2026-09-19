const scopes = [
  "instagram_business_basic",
  "instagram_business_content_publish",
];

export const getInstAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URI!,
    response_type: "code",
    scope: scopes.join(","),
    enable_fb_login: "0",
    force_authentication: "1",
  });

  console.log(params, 'getAuth')

  return `https://api.instagram.com/oauth/authorize?${params}`;
};

export const checkInstAvailability = async (user_id, token) => {
  const res = await fetch(
    `https://graph.instagram.com/v23.0/${user_id}?` +
    new URLSearchParams({
      fields: "username,account_type",
      access_token: token,
    })
  );

  return await res.json()
}

export async function publishToInstagram(
  strapi,
  post,
) {
  const videoUrl =
    process.env.PUBLIC_URL + post.video.url;

  const account = post.account
  let token = account.accessToken;

  if (shouldRefreshToken(account)) {
    token = await refreshInstagramToken(account);
    account.accessToken = token
  }

  const container = await createContainer(
    account,
    post,
    videoUrl
  );

  await waitUntilFinished(account, container.id);

  const reel = await publishContainer(
    account,
    container.id
  );

  const res = await fetch(
    `https://graph.instagram.com/v23.0/${reel.id}?` +
    new URLSearchParams({
      fields: "id,permalink",
      access_token: account.accessToken,
    })
  );

  const media = await res.json();

  console.log(media);

  await strapi.documents("api::post.post").update({
    documentId: post.documentId,
    data: {
      link: media.permalink,
      publish_status: "published",
    },
  });

  return reel;
}

async function createContainer(account, post, videoUrl: string) {
  console.log(videoUrl, "createContainer")


  const res = await fetch(
    `https://graph.instagram.com/v23.0/${account.externalId}/media`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        media_type: "REELS",
        video_url: videoUrl,
        caption: post.description ?? "",
        access_token: account.accessToken,
      }),
    }
  );

  return await res.json();
}

async function waitUntilFinished(account, containerId: string) {
  while (true) {
    const res = await fetch(
      `https://graph.instagram.com/v23.0/${containerId}?` +
      new URLSearchParams({
        fields: "status_code,status,error_message",
        access_token: account.accessToken,
      })
    );

    const json = await res.json();
    console.log(json, 'waitUntilFinished')
    if (json.status_code === "FINISHED") return;

    if (json.status_code === "ERROR") {
      throw new Error("Instagram processing failed");
    }

    await new Promise((r) => setTimeout(r, 7000));
  }
}

async function publishContainer(account, containerId: string) {
  const res = await fetch(
    `https://graph.instagram.com/v23.0/${account.externalId}/media_publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: account.accessToken,
      }),
    }
  );

  return await res.json();
}

async function refreshInstagramToken(account) {
  const res = await fetch(
    "https://graph.instagram.com/refresh_access_token?" +
    new URLSearchParams({
      grant_type: "ig_refresh_token",
      access_token: account.accessToken,
    })
  );

  const json = await res.json();

  await strapi.documents("api::account.account").update({
    documentId: account.documentId,
    data: {
      accessToken: json.access_token,
      expiresAt: new Date(
        Date.now() + json.expires_in * 1000
      ),
    },
  });

  return json.access_token;
}

function shouldRefreshToken(account) {
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  return account.expiresAt.getTime() - Date.now() < sevenDays;
}