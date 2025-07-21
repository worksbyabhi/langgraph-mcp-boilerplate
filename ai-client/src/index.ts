import dotenv from "dotenv";
dotenv.config();

import { getCalculatorAgent } from "./getCalculatorAgent";

const main = async () => {
  const calculatorAgent = await getCalculatorAgent();
  console.log("Agent connected");

  const result = await calculatorAgent.invoke({
    messages: [{ role: "user", content: "What is 4 plus 5 and 6 minus 3" }],
  });

  console.log(
    JSON.stringify(result.messages[result.messages.length - 1].content)
  );

  process.exit(0);
};

main();
