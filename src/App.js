import { useState } from "react";
import axios from "axios";
import "./App.css";

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
        <button key={file.url} onClick={() => getFileResults(file.url)}>
          {file.name}
        </button>
      );
    });

    return btnDisplay;
  };

  console.log("uploadedFiles", uploadedFiles);

  return (
    <div>
      <h1>Borg File Upload</h1>
      <h3>Choose a file</h3>
      <div>
        <input type="file" accept=".pdf" onChange={onFileChange} />
        <button onClick={onFileUpload}>Upload!</button>
      </div>
      {fileData()}
      {getUploadedFiles()}
    </div>
  );
}

export default App;
