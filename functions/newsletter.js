const fetch = require("node-fetch");

exports.handler = async (event) => {
  const url = "https://graphql.fauna.com/graphql";
  const { firstName, email } = JSON.parse(event.body);

  try {
    if (!firstName) {
      throw new Error("Name is required");
    }
    if (!email) {
      throw new Error("Email is required");
    }
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CK_API_KEY}`,
      },
      body: JSON.stringify({
        query: `mutation {createUser(data: {firstName: ${firstName}, email: ${email}  }) {firstName email}}`,
      }),
    })
      .then((response) => response.json())
      .catch((error) => {
        throw new Error(error);
      });

    if (response.errors) {
      const message =
        response.errors[0].extensions.code === "instance not unique"
          ? "Email already subscribed."
          : response.errors[0].message;
      return {
        statusCode: 500,
        "Content-Type": "application/json",
        body: message,
      };
    }
    return {
      statusCode: 200,
      "Content-Type": "application/json",
      body: JSON.stringify(response),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify(error.message),
    };
  }
};
