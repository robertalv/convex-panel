import axios from "axios";

const CONVEX_URL = "https://friendly-wombat-759.convex.cloud";

/**
 * Create or update user in Convex database after OAuth login
 * To be used after PRO features are gated
 */
export async function createUserInConvex(
  email: string,
  name?: string,
): Promise<string> {
  try {
    const response = await axios.post(
      `${CONVEX_URL}/api/mutation`,
      {
        path: "users:getOrCreateUser",
        args: {
          email,
          name,
        },
        format: "json",
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    const userId = response.data.value;
    return userId;
  } catch (error: any) {
    throw error;
  }
}
