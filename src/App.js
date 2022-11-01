import { useState } from "react";
import axios from "axios";
import "./App.css";
import "@heartlandone/vega/style/vega.css";
import { VegaButton } from "@heartlandone/vega-react";
import Dropzone from "./components/Dropzone";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [analyzedResults, setAnalyzedResults] = useState(null);

  const onFileChange = (file) => {
    setSelectedFile(file);
  };

  const onFileUpload = () => {
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
          },
        ]);
      });
  };

  const fileData = () => {
    if (selectedFile) {
      console.log(selectedFile);
      return (
        <div>
          <h2>File Details</h2>

          <p>File Name: {selectedFile.name}</p>

          <p>File Type: {selectedFile.type}</p>

          {/* <p>Last Modified: {new Date(selectedFile.lastModifiedDate)}</p> */}
        </div>
      );
    } else {
      return (
        <div>
          <br />
          <h4>Choose before Pressing the Upload button</h4>
        </div>
      );
    }
  };

  const analyzeResultDisplay = (data) => {
    const baseInfo = [];

    data.documents[0].fields["Card Summary"].valueArray.forEach(
      (vAray, index) => {
        baseInfo.push(
          <tr key={index}>
            <td>{vAray.valueObject["Card Type"].valueString ?? "unknown"}</td>
            <td>{vAray.valueObject["Items"].valueString ?? "unknown"}</td>
            <td>{vAray.valueObject["Amount"].valueString ?? "unknown"}</td>
          </tr>
        );
      }
    );

    const resultDisplay = (
      <>
        <h3 className="text-xl text-gray-500">Results</h3>
        <table>
          <tr key={"header"}>
            <th>Card Type</th>
            <th>Items</th>
            <th>Amount</th>
          </tr>
          {baseInfo}
        </table>
      </>
    );
    setAnalyzedResults(resultDisplay);
  };

  const getFileResults = (url) => {
    //Get analyzed results
    axios
      .get(url, {
        headers: {
          "Ocp-Apim-Subscription-Key": "da8bfe2500824ee59533090b62c12f51",
          "Content-Type": "application/pdf",
        },
      })
      .then((response) => {
        if (response.data.status === "succeeded")
          analyzeResultDisplay(response.data.analyzeResult);
        if (response.data.status === "error")
          alert("Error processing. Please Reupload document");
        if (response.data.status === "submitted")
          alert("Still Processing. Please try again.");
      });
  };

  const getUploadedFiles = () => {
    const btnDisplay = [];
    uploadedFiles.forEach((file) => {
      btnDisplay.push(
        <VegaButton
          key={file.url}
          className="result-button"
          onClick={() => getFileResults(file.url)}
        >
          {file.name}
        </VegaButton>
      );
    });

    return btnDisplay;
  };

  return (
    <div className="flex min-h-screen items-center justify-center py-12 px-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-black">Borg File Upload</h1>
          <h3 className="text-xl text-gray-500">Choose a file</h3>
          {/* <div className="mt-4">
            <input type="file" accept=".pdf" onChange={onFileChange} />
          </div> */}
          <Dropzone open={true} onFileSelect={onFileChange} />
          <VegaButton onClick={onFileUpload}>Upload!</VegaButton>
          {fileData()}
          {getUploadedFiles()}
          {analyzedResults}
        </div>
      </div>
    </div>
  );
}

export default App;
