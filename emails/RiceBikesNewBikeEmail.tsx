import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import * as React from "react";

interface RiceBikesNewBikeEmailProps {
  username: string;
  transaction_num: number;
  bike_make?: string | null;
  bike_model?: string | null;
}

export const RiceBikesNewBikeEmail = ({
  username,
  transaction_num,
  bike_make,
  bike_model,
}: RiceBikesNewBikeEmailProps) => {
  const previewText = `Rice Bikes - Your new bike is ready for pickup - ${transaction_num}`;

  const bikeLine = bike_make || bike_model ? ` (${[bike_make, bike_model].filter(Boolean).join(" ")})` : "";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
              Hi {username},
            </Heading>

            <Text className="text-black text-[14px] leading-[24px]">Thanks for choosing Rice Bikes!</Text>

            <Text className="text-black text-[14px] leading-[24px]">
              We’re excited to let you know your new bike{bikeLine} is ready for pickup.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              No appointment is necessary — just stop by the shop during our open hours and reference your order number{" "}
              <strong>#{transaction_num}</strong>.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              Please plan to pick up your new bike within <strong>7 days</strong> so we can finalize your purchase and
              get you rolling. If you have any questions, simply reply to this email and our team will be happy to help.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">
              After 30 days, Rice Bikes may release the bike back into our inventory.
            </Text>

            <Text className="text-black text-[14px] leading-[24px]">Best,</Text>
            <Text className="text-black text-[14px] leading-[24px]">The Rice Bikes team</Text>

            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />

            <Text className="text-black text-[14px] leading-[24px]">Learn more or get in touch:</Text>

            <Section className="text-center mt-[24px] mb-[12px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="https://ricebikes.com"
              >
                Visit our website
              </Button>
            </Section>

            <Section className="text-center mt-[12px] mb-[24px]">
              <Button
                className="bg-[#3b5998] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="https://facebook.com/ricebikes"
              >
                Like us on Facebook
              </Button>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default RiceBikesNewBikeEmail;
