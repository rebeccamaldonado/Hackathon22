import { useState } from "react";
import axios from "axios";
import "./App.css";
import "@heartlandone/vega/style/vega.css";
import { VegaButton } from "@heartlandone/vega-react";

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const onFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const onFileUpload = () => {
    const formData = new FormData();

    formData.append("myFile", selectedFile, selectedFile.name);

    // Details of the uploaded file
    console.log("uploading", selectedFile);

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
        console.log(response);
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
      return (
        <div>
          <h2>File Details:</h2>

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

    data.documents[0].fields["Card Summary"].valueArray.forEach((vAray) => {
      console.log(vAray);
      baseInfo.push(
        <>
          <p>{vAray.valueObject["Card Type"].valueString}</p>
          <p>{vAray.valueObject["Items"].valueString}</p>
          <p>{vAray.valueObject["Amount"].valueString}</p>
        </>
      );
    });

    console.log(baseInfo);
  };

  const getFileResults = (url) => {
    console.log("url", url);
    axios
      .get(url, {
        headers: {
          "Ocp-Apim-Subscription-Key": "da8bfe2500824ee59533090b62c12f51",
          "Content-Type": "application/pdf",
        },
      })
      .then((response) => {
        console.log(response);
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
        <VegaButton key={file.url} onClick={() => getFileResults(file.url)}>
          {file.name}
        </VegaButton>
      );
    });

    return btnDisplay;
  };

  console.log("uploadedFiles", uploadedFiles);

  return (
    <div class="flex min-h-screen items-center justify-center py-12 px-4">
      <div class="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-3xl font-black">Borg File Upload</h1>
          <h3 className="text-xl text-gray-500">Choose a file</h3>
          <div className="mt-4">
            <input type="file" accept=".pdf" onChange={onFileChange} />
            <VegaButton onClick={onFileUpload}>Upload!</VegaButton>
          </div>
          {fileData()}
          {getUploadedFiles()}
        </div>
      </div>
    </div>
  );
}

export default App;
