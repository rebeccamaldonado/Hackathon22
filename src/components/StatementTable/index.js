import { useState } from "react";
import { VegaTable, VegaAccordion } from "@heartlandone/vega-react";

const StatmentTable = ({ data, columns, title }) => {
  const [expanded, setExpaned] = useState(false);

  return (
    <VegaAccordion
      accordionTitle={title}
      expand={expanded}
      onClick={() => setExpaned(!expanded)}
    >
      <div slot="content">
        <h1 className="text-xl">Fees Charged</h1>
        <VegaTable dataSource={data} columns={columns} />
      </div>
    </VegaAccordion>
  );
};

export default StatmentTable;
