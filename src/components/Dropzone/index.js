import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCloudArrowUp } from "@fortawesome/free-solid-svg-icons";
import "./index.css";

function Dropzone({ onFileSelect }) {
  const onDrop = useCallback(
    (acceptedFiles) => {
      onFileSelect(acceptedFiles[0]);
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    maxSize: 52428800, //50MB
  });

  return (
    <div {...getRootProps({ className: "dropzone" })}>
      <input className="input-zone" {...getInputProps()} />
      <div className="text-center">
        {isDragActive ? (
          <p className="dropzone-content">Release to drop the files here</p>
        ) : (
          <div className="dropzone-content">
            <FontAwesomeIcon className="dropzone-icon" icon={faCloudArrowUp} />
            <p>Drag & drop files or click to browse</p>
            <p className="dropzone-subtext">
              Currently only .PDF format is supported
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dropzone;
