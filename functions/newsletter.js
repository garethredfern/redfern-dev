const fetch = require("node-fetch");

exports.handler = async (event) => {
  const url = "https://graphql.fauna.com/graphql";
  const { firstName, email } = JSON.parse(event.body);
  const authKey = `Bearer ${process.env.FAUNA_API_KEY}`;

  const qv = {
    data: {
      firstName,
      email,
    },
  };

  const query = `
    mutation($data: UserInput!) {
      createUser(data: $data) {
        firstName
        email
      }
    }`;

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
        Authorization: authKey,
      },
      body: JSON.stringify({ query, variables: qv }),
    })
      .then((response) => response.json())
      .catch((error) => {
        throw new Error(error);
      });

    if (response.errors) {
      const message =
        response.errors[0].message === "Instance not unique"
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
