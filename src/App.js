import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import "@heartlandone/vega/style/vega.css";
import { VegaCard } from "@heartlandone/vega-react";

function App() {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [pollTimer, setPollTimer] = useState(0);

  useEffect(() => {
    setInterval(() => setPollTimer(p => p + 1), 1000);
  }, []);

  useEffect(() => {
    uploadedFiles.map(async (file) => {
      if (file.status !== 'Processing') return;

      axios
        .get(file.url, {
          headers: {
            "Ocp-Apim-Subscription-Key": "da8bfe2500824ee59533090b62c12f51",
            "Content-Type": "application/pdf",
          },
        })
        .then((response) => {
          if (response.data.status === "succeeded") {
            file.baseInfo = [];
            file.status = "Complete"
            response.data.analyzeResult.documents[0].fields["Card Summary"].valueArray.forEach(
              (vAray, index) => {
                file.baseInfo.push({
                  cardType: vAray.valueObject["Card Type"].valueString ?? "unknown",
                  items: vAray.valueObject["Items"].valueString ?? "unknown",
                  amount: vAray.valueObject["Amount"].valueString ?? "unknown",
                });
              }
            );
          } else if (response.data.status === "error")
            file.status = 'Error';
        });
    });
  }, [pollTimer, uploadedFiles]);

  const onFileChange = useCallback((event) => {
    const selectedFile = event.target.files[0];
    const formData = new FormData();
  
    formData.append("myFile", selectedFile, selectedFile.name);
  
    // Send formData object
    axios
      .post(
        "https://borgcollectivehackathon22.cognitiveservices.azure.com/formrecognizer/documentModels/4ProcessorComposeModel:analyze?api-version=2022-08-31",
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
            status: 'Processing',
          },
        ]);
      });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4">
      <div className="w-full max-w-xl space-y-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-black text-center">Upload a PDF of the merchant's document to begin pricing</h1>
          <div className="bg-slate-200 p-20 my-5 border-dashed border-2 border-slate-500 rounded-lg text-center">
            <div className="text-md font-bold">Drag &amp; drop files or Browse</div>
            <div className="text-xs text-slate-600">Supported formats: PDF</div>
            <input type="file" accept=".pdf" onChange={onFileChange} />
          </div>
          {uploadedFiles.map((file) => (
            <VegaCard className="mt-5">
              <div className="flex flex-col p-4">
                <div className="flex justify-between">
                  <div> File: {file.name} </div>
                  <div> {file.status} </div>
                </div>
                {file.baseInfo && file.baseInfo.length && (
                  <table className="table-auto">
                    <tr key={"header"}>
                      <th>Card Type</th>
                      <th>Items</th>
                      <th>Amount</th>
                    </tr>
                    {file.baseInfo.map((info, i) => (
                      <tr key={i}>
                        <td>{info.cardType}</td>
                        <td>{info.items}</td>
                        <td>{info.amount}</td>
                      </tr>
                    ))}
                  </table>
                )}
              </div>
            </VegaCard>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
