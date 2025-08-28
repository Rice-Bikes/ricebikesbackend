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
} from '@react-email/components';
import {
  Repair,
} from '../src/api/transactionComponents/repairs/repairModel';
import {
  Item
} from '../src/api/transactionComponents/items/itemModel';

const SALES_TAX = 1.0825
interface RiceBikesRecieptProps {
  username: string;
  transaction_num: number;
  email?: string;
  items: Item[];
  repairs: Repair[];
}


export const RiceBikesReciept = ({
  username,
  transaction_num,
  items = [],
  repairs = [],
}: RiceBikesRecieptProps) => {
  const previewText = `Rice Bikes - Your bike is ready for pickup - ${transaction_num}`;
  const repairList = repairs.map(item => item.name);
  const itemList = items.map(item => item.name);

  const formattedTotal = ((items.reduce((sum, item) => sum + item.standard_price, 0) + repairs.reduce((sum, repair) => sum + repair.price, 0)) * SALES_TAX).toFixed(2);
  const formattedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
            <Heading className="text-black text-[22px] font-semibold text-center p-0 my-[18px] mx-0">
              Your Rice Bikes receipt
            </Heading>
            <Text className="text-black text-[14px] leading-[20px] text-center mb-4">
              Thank you for visiting Rice Bikes! Below is your receipt. Please note that tax is applied to your final total.
            </Text>
            <Text className="text-black text-[13px] leading-[20px] text-center mt-3 mb-2">
              Transaction number: {transaction_num}
            </Text>
            <Text className="text-black text-[13px] leading-[20px] text-center mb-6">
              {formattedDate}
            </Text>
            <Section className="my-4">
              <Section className="mb-2">
                <Heading className="text-black text-[16px] font-semibold mb-2">Items</Heading>
                {itemList.length > 0 ? (
                  <Section>
                    {itemList.map((itm, i) => (
                      <Text key={i} className="text-black text-[14px] leading-[20px] mb-2">• {itm.trim()}</Text>
                    ))}
                  </Section>
                ) : (
                  <Text className="text-gray-500">No items listed</Text>
                )}
              </Section>

              <Section className="mt-3">
                <Heading className="text-black text-[16px] font-semibold mb-2">Repairs</Heading>
                {repairList.length > 0 ? (
                  <Section>
                    {repairList.map((repair, index) => (
                      <Text key={index} className="text-black text-[14px] leading-[20px] mb-2">• {repair.trim()}</Text>
                    ))}
                  </Section>
                ) : (
                  <Text className="text-gray-500">No repairs listed</Text>
                )}
              </Section>
            </Section>
            <Text className="text-black text-[14px] leading-[20px] mt-4">Total: {formattedTotal}</Text>

            <Text className="text-black text-[14px] leading-[24px] mt-6">
              No appointment is necessary to pick up your bike.
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

export default RiceBikesReciept;