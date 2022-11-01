import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import "@heartlandone/vega/style/vega.css";
import Dropzone from "./components/Dropzone";
import { VegaTable } from "@heartlandone/vega-react";

const CARD_SUMMARY_COLUMNS = [
  {
    label: 'Card Type',
    prop: 'cardType',
  },
  {
    label: 'Transaction Volume',
    prop: 'items',
  },
  {
    label: 'Transaction Dollars',
    prop: 'amount',
  },
];
const FEES_CHARGED_COLUMNS = [
  {
    label: 'Description',
    prop: 'description',
  },
  {
    label: 'Type',
    prop: 'type',
  },
  {
    label: 'Amount',
    prop: 'amount',
  },
];

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pollTimer, setPollTimer] = useState(0);

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
            file.baseInfo = [];
            response.data.analyzeResult.documents[0].fields[
              "Card Summary"
            ].valueArray.forEach((vAray, index) => {
              file.baseInfo.push({
                cardType:
                  vAray.valueObject["Card Type"].valueString ?? "unknown",
                items: vAray.valueObject["Items"].valueString ?? "unknown",
                amount: vAray.valueObject["Amount"].valueString ?? "unknown",
                key: index,
              });
            });
            file.feeInfo = [];
            response.data.analyzeResult.documents[0].fields[
              "Fees Charged"
            ].valueArray.forEach((vAray, index) => {
              file.feeInfo.push({
                description:
                  vAray.valueObject["Description"].valueString ?? "unknown",
                type: vAray.valueObject["Type"].valueString ?? "unknown",
                amount: vAray.valueObject["Amount"].valueString ?? "unknown",
                key: index,
              });
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
    <div className="flex min-h-screen items-center justify-center py-12 px-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-center">
            Upload a PDF of the merchant's document to begin pricing
          </h1>
          <Dropzone onFileSelect={onFileChange} />
          {uploadedFiles.map((file) => (
            <div key={file.url} className="mt-5 bg-slate-100 rounded-lg">
              <div className="flex flex-col">
                <div className="flex justify-between p-4">
                  {file.merchantName ? (
                    <div> {file.merchantName} </div>
                  ) : (
                    <div> File: {file.name} </div>
                  )}
                  <div> {file.status} </div>
                </div>
                {file.baseInfo && file.baseInfo.length > 0 && (
                  <div className="p-4 border-t-2 border-slate-200">
                    <h1 className="text-xl">Transaction Summary</h1>
                    <VegaTable dataSource={file.baseInfo} columns={CARD_SUMMARY_COLUMNS}></VegaTable>
                  </div>
                )}
                {file.feeInfo && file.feeInfo.length > 0 && (
                  <div className="p-4 border-t-2 border-slate-200">
                    <h1 className="text-xl">Fees Charged</h1>
                    <VegaTable dataSource={file.feeInfo} columns={FEES_CHARGED_COLUMNS}></VegaTable>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
