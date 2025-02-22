import {
  Body,
  Button,
  // Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  // Link,
  Preview,
  // Row,
  Section,
  Tailwind,
  Text,
} from '@react-email/components';

interface RiceBikesEmailProps {
  username?: string;
  transaction_num?: number;
  email?: string
  // bikeReadyDate?: Date;

}
import * as React from 'react';

// const baseUrl = "localhost:3000/preview"

export const RiceBikesEmail = ({
  username,
  transaction_num,
}: RiceBikesEmailProps) => {
  const previewText = `Rice Bikes - Your bike is ready for pickup - ${transaction_num}`;

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
            <Text className="text-black text-[14px] leading-[24px]">
              Thanks for visiting Rice Bikes!
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              This is an email to let you know your bike is ready for pickup.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              No appointment is necessary to pickup your bike.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Please note that if you do not pick up your bike within 7 days, you will be charged a storage fee of $5 for each additional day.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              After 30 additional days, Rice Bikes reserves the right to retain your bike as collateral.
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              Best,
            </Text>
            <Text className="text-black text-[14px] leading-[24px]">
              The Rice Bikes team
            </Text>
            <Hr className="border border-solid border-[#eaeaea] my-[26px] mx-0 w-full" />
            <Text className="text-black text-[14px] leading-[24px]">
              Leave us some feedback!
            </Text>
            <Section className="text-center mt-[32px] mb-[32px]">
              <Button
                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                href="https://ricebikes.com"
              >
                Visit our website
              </Button>
            </Section>
            <Section className="text-center mt-[32px] mb-[32px]">
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

export default RiceBikesEmail;
