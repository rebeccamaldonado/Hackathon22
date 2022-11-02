import { useState } from "react";
import { VegaTable, VegaAccordion } from "@heartlandone/vega-react";

const StatmentTable = ({ data, columns, title }) => {
  const [expanded, setExpaned] = useState(false);

  return (
    <div className="p-4 border-t-2 border-slate-200">
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
    </div>
  );
};

export default StatmentTable;
