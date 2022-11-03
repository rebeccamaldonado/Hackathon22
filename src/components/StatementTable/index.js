import { VegaTable, VegaAccordion } from "@heartlandone/vega-react";

export const CARD_SUMMARY_COLUMNS = "CARD_SUMMARY_COLUMNS";

export const FEES_CHARGED_COLUMNS = "FEES_CHARGED_COLUMNS";

const StatmentTable = ({ data, columnType, title, onChange }) => {
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
          label: "Card Type",
          prop: "description",
          render: (createElement, value, record) => {
            return createElement(
              "vega-flex",
              {
                gap: "size-8",
              },
              [
                createElement(
                  "vega-button",
                  {
                    "data-shrink": 0,
                    size: "small",
                    variant: record.cardType === "vm" ? "primary" : "secondary",
                    onClick: (event) => {
                      event.preventDefault();
                      onChange(data.id, "vm", record);
                    },
                  },
                  "VM"
                ),
                createElement(
                  "vega-button",
                  {
                    "data-shrink": 0,
                    size: "small",
                    variant: record.cardType === "ax" ? "primary" : "secondary",
                    onClick: (event) => {
                      event.preventDefault();
                      onChange(data.id, "ax", record);
                    },
                  },
                  "AX"
                ),
                createElement(
                  "vega-button",
                  {
                    "data-shrink": 0,
                    size: "small",
                    variant: record.cardType === "na" ? "primary" : "secondary",
                    onClick: (event) => {
                      event.preventDefault();
                      onChange(data.id, "na", record);
                    },
                  },
                  "N/A"
                ),
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
          width: "75px",
        },
        {
          label: "Amount",
          prop: "amount",
          width: "100px",
        },
      ];
      break;
    default:
      break;
  }

  return (
    <VegaAccordion accordionTitle={title}>
      <div slot="content">
        {columns && data.data && (
          <VegaTable dataSource={data.data} columns={columns} />
        )}
      </div>
    </VegaAccordion>
  );
};

export default StatmentTable;
