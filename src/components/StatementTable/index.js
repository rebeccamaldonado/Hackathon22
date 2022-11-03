import { useState } from "react";
import { VegaTable, VegaAccordion } from "@heartlandone/vega-react";

export const CARD_SUMMARY_COLUMNS = "CARD_SUMMARY_COLUMNS";

export const FEES_CHARGED_COLUMNS = "FEES_CHARGED_COLUMNS";

const StatmentTable = ({ data, columnType, title, onChange }) => {
  const [expanded, setExpaned] = useState(false);

  let columns = null;

  switch (columnType) {
    case CARD_SUMMARY_COLUMNS:
      columns = [
        {
          label: "Card Type",
          prop: "cardType",
        },
        {
          label: "Transaction Volume",
          prop: "items",
        },
        {
          label: "Transaction Dollars",
          prop: "amount",
        },
      ];
      break;
    case FEES_CHARGED_COLUMNS:
      columns = [
        {
          label: "V/M AX N/A",
          prop: "description",
          render: (createElement, value, record) => {
            const isVisaMastercard =
              value.startsWith("VISA") ||
              value.startsWith("VI") ||
              value.startsWith("MC") ||
              value.startsWith("MASTERCARD");

            const isAx = value.startsWith("AMEX");

            return createElement(
              "vega-radio-group",
              {
                name: "cardType",
                id: value,
                required: false,
                onChange: (event) => {
                  onChange(data.id, event.target.value, record);
                },
              },
              [
                createElement("vega-radio", {
                  value: "vm",
                  checked: isVisaMastercard,
                }),
                createElement("vega-radio", {
                  value: "ax",
                  checked: isAx,
                }),
                createElement("vega-radio", {
                  value: "na",
                  checked: !isAx && !isVisaMastercard,
                }),
              ]
            );
          },
        },
        {
          label: "Description",
          prop: "description",
        },
        {
          label: "Type",
          prop: "type",
        },
        {
          label: "Amount",
          prop: "amount",
        },
      ];
      break;
    default:
      break;
  }

  return (
    <VegaAccordion
      accordionTitle={title}
      expand={expanded}
      onClick={() => setExpaned(!expanded)}
    >
      <div slot="content">
        <h1 className="text-xl">Fees Charged</h1>
        <VegaTable dataSource={data.data} columns={columns} />
      </div>
    </VegaAccordion>
  );
};

export default StatmentTable;
