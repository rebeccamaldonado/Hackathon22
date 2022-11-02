import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import "@heartlandone/vega/style/vega.css";
import heartlandLogo from "./Heartland_Logo.svg";
import Dropzone from "./components/Dropzone";
import {
  VegaTable,
  VegaAccordion,
  VegaAppFooter,
  VegaCard
} from "@heartlandone/vega-react";

const ACCEPTED_FEE_PHRASES = ["mastercard", "mc", "visa", "vi"];

const REJECTED_FEE_PHRASES = ["debit", "batch", "pci compliance", "refund"];

const CARD_SUMMARY_COLUMNS = [
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
const FEES_CHARGED_COLUMNS = [
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

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pollTimer, setPollTimer] = useState(0);
  const [expandSummary, setExpandSummary] = useState(false);
  const [expandFees, setExpandFees] = useState(false);

  useEffect(() => {
    setInterval(() => setPollTimer((p) => p + 1), 1500);
  }, []);

  useEffect(() => {
    uploadedFiles.map(async (file) => {
      if (file.status !== "Processing") return;

      axios
        .get(file.url, {
          headers: {
            "Ocp-Apim-Subscription-Key": "da8bfe2500824ee59533090b62c12f51",
            "Content-Type": "application/pdf",
          },
        })
        .then((response) => {
          if (response.data.status === "succeeded") {
            file.status = "Complete";
            file.merchantName =
              response.data.analyzeResult.documents[0].fields[
                "Merchant Name"
              ].valueString;
            file.statementDate =
              response.data.analyzeResult.documents[0].fields[
                "Statement Date"
              ].valueString;
            file.baseInfo = [];
            file.mcVisaTotal = 0.00
            response.data.analyzeResult.documents[0].fields[
              "Card Summary"
            ].valueArray.forEach((vArray, index) => {
              let cardType = vArray.valueObject["Card Type"].valueString ?? "unknown"
              file.baseInfo.push({
                cardType:
                  cardType,
                items: vArray.valueObject["Items"].valueString ?? "unknown",
                amount: vArray.valueObject["Amount"].valueString ?? "unknown",
                key: index,
              });
              if (cardType.toLowerCase() === "mastercard" || cardType.toLowerCase() === "visa") {
                file.mcVisaTotal += parseFloat(vArray.valueObject["Amount"].valueString ? Number(vArray.valueObject["Amount"].valueString.replace(/[^0-9.-]+/g,"")) :  "0")
              } else if ((cardType.toLowerCase()).includes("amex")) {
                file.amex = vArray.valueObject["Amount"].valueString ?? "unknown"
              }
            });
            file.feeInfo = [];
            response.data.analyzeResult.documents[0].fields[
              "Fees Charged"
            ].valueArray.forEach((vArray, index) => {
              // We want visa/mastercard fee rows but don't need rows with 'debit', 'refund', etc.
              let desc =
                vArray.valueObject["Description"].valueString.toLowerCase();
              if (
                ACCEPTED_FEE_PHRASES.some((phrase) => desc.includes(phrase))
              ) {
                if (
                  !REJECTED_FEE_PHRASES.some((phrase) => desc.includes(phrase))
                ) {
                  file.feeInfo.push({

                    description:
                      vArray.valueObject["Description"].valueString ??
                      "unknown",
                    type: vArray.valueObject["Type"].valueString ?? "unknown",
                    amount:
                      vArray.valueObject["Amount"].valueString ?? "unknown",
                    key: index,
                  });
                }
              }
            });
          } else if (response.data.status === "error") file.status = "Error";
        });
    });
  }, [pollTimer, uploadedFiles]);

  const onFileChange = useCallback((file) => {
    const selectedFile = file;
    const formData = new FormData();

    formData.append("myFile", selectedFile, selectedFile.name);

    // Send formData object
    axios
      .post(
        "https://borgcollectivehackathon22.cognitiveservices.azure.com/formrecognizer/documentModels/BofAFees2:analyze?api-version=2022-08-31",
        formData,
        {
          headers: {
            "Ocp-Apim-Subscription-Key": "da8bfe2500824ee59533090b62c12f51",
            "Content-Type": "application/pdf",
          },
        }
      )
      .then((response) => {
        setUploadedFiles((prevState) => [
          ...prevState,
          {
            name: selectedFile.name,
            url: response.headers.get("operation-location"),
            status: "Processing",
          },
        ]);
      });
  }, []);

  return (
    <div className="items-center justify-center py-12 px-4">
      <div className="grid grid-cols-1 gap-4 place-items-center">
        <img className="" src={heartlandLogo} alt="heartlandlogo" />
      </div>

      <div className="flex min-h-screen justify-center py-12 px-4">
        <div className="w-full max-w-4xl space-y-8">
          <div className="flex flex-col">
            <h1 className="text-2xl font-sans text-center">
              Upload a PDF of the merchant's document to begin pricing
            </h1>
            <div className="w-full max-w-xl self-center space-y-8">
              <Dropzone onFileSelect={onFileChange} />
            </div>
            {uploadedFiles.map((file) => (
              <div key={file.url} className="mt-5 bg-slate-100 rounded-lg">
                <div className="flex flex-col">
                  <div className="flex justify-between p-4">
                    {file.merchantName ? (
                      <div>
                      <div> {file.merchantName} </div>
                      {file.statementDate ? <div> {"Statement Date: "+file.statementDate} </div> : null}
                      </div>
                    ) : (
                      <div> File: {file.name} </div>
                    )}

                    <div className="flex flex-row">
                      {file.status === "Processing" && (
                        <img
                          src={require("./borg_loader.png")}
                          alt="loading spinner"
                          className="load-spinner mr-1 "
                        />
                      )}
                      {file.status}
                    </div>
                  </div>
                  {file.baseInfo && file.baseInfo.length > 0 && (
                    <div className="p-4 border-t-2 border-slate-200">
                      <VegaCard  
                        padding="size-24" 
                        margin="size-8"
                      >
                      <h1 className="text-xl">
                          <strong>Transaction Summary</strong>
                        </h1>
                        {file.mcVisaTotal && file.mcVisaTotal !== 0 ? "Mastercard/Visa Total: $"+file.mcVisaTotal.toString() : ""}
                        {file.amex ? "American Express Total: "+file.amex : ""}
                      </VegaCard>
                      <VegaAccordion
                        accordionTitle="Transaction Summary Details"
                        expand={expandSummary}
                        onClick={() => setExpandSummary(!expandSummary)}
                      >
                        <div slot="content">
                          <VegaTable
                            dataSource={file.baseInfo}
                            columns={CARD_SUMMARY_COLUMNS}
                          ></VegaTable>
                        </div>
                      </VegaAccordion>
                    </div>
                  )}
                  {file.feeInfo && file.feeInfo.length > 0 && (
                    <div className="p-4 border-t-2 border-slate-200">
                      <VegaCard  
                        padding="size-24" 
                        margin="size-8"
                      >
                      <h1 className="text-xl">
                          <strong>Fee Summary</strong>
                        </h1>
                        
                      </VegaCard>
                      <VegaAccordion
                        accordionTitle="Fees Charged"
                        expand={expandFees}
                        onClick={() => setExpandFees(!expandFees)}
                      >
                        <div slot="content">
                          <h1 className="text-xl">Fees Details</h1>
                          <VegaTable
                            dataSource={file.feeInfo}
                            columns={FEES_CHARGED_COLUMNS}
                          ></VegaTable>
                        </div>
                      </VegaAccordion>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <VegaAppFooter />
    </div>
  );
}

export default App;
