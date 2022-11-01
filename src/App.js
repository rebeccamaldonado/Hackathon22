import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import "@heartlandone/vega/style/vega.css";
import Dropzone from "./components/Dropzone";

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
                    <table className="table-auto border-collapse border border-slate-500">
                      <tr key={"header"}>
                        <th className="border border-slate-300 p-1">
                          Card Type
                        </th>
                        <th className="border border-slate-300 p-1">
                          Transaction Volume
                        </th>
                        <th className="border border-slate-300 p-1">
                          Transaction Dollars
                        </th>
                      </tr>
                      {file.baseInfo.map((info, i) => (
                        <tr key={i}>
                          <td className="border border-slate-300 p-1">
                            {info.cardType}
                          </td>
                          <td className="border border-slate-300 p-1">
                            {info.items}
                          </td>
                          <td className="border border-slate-300 p-1">
                            {info.amount}
                          </td>
                        </tr>
                      ))}
                    </table>
                  </div>
                )}
                {file.feeInfo && file.feeInfo.length > 0 && (
                  <div className="p-4 border-t-2 border-slate-200">
                    <h1 className="text-xl">Fees Charged</h1>
                    <table className="table-auto">
                      <tr key={"header"}>
                        <th className="border border-slate-300 p-1">
                          Description
                        </th>
                        <th className="border border-slate-300 p-1">Type</th>
                        <th className="border border-slate-300 p-1">Amount</th>
                      </tr>
                      {file.feeInfo.map((info, i) => (
                        <tr key={i}>
                          <td className="border border-slate-300 p-1">
                            {info.description}
                          </td>
                          <td className="border border-slate-300 p-1">
                            {info.type}
                          </td>
                          <td className="border border-slate-300 p-1">
                            {info.amount}
                          </td>
                        </tr>
                      ))}
                    </table>
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
