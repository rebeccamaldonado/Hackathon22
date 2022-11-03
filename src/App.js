import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import "./App.css";
import "@heartlandone/vega/style/vega.css";
import heartlandLogo from "./Heartland_Logo.svg";
import Dropzone from "./components/Dropzone";
import { VegaCard, VegaAppFooter } from "@heartlandone/vega-react";
import StatmentTable from "./components/StatementTable";
import {
  FEES_CHARGED_COLUMNS,
  CARD_SUMMARY_COLUMNS,
} from "./components/StatementTable";

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
            file.statementDate =
              response.data.analyzeResult.documents[0].fields[
                "Statement Date"
              ].valueString;
            file.baseInfo = [];
            file.mcVisaTotal = 0.0;
            file.mcVisaTransactionCountTotal = 0;
            file.amexTransactionCountTotal = 0;
            file.amex = 0.0;

            response.data.analyzeResult.documents[0].fields[
              "Card Summary"
            ].valueArray.forEach((vArray, index) => {
              let cardType =
                vArray.valueObject["Card Type"].valueString ?? "unknown";
              file.baseInfo.push({
                cardType: cardType,
                items: vArray.valueObject["Items"].valueString ?? "unknown",
                amount: vArray.valueObject["Amount"].valueString ?? "unknown",
                key: index,
              });
              if (
                cardType.toLowerCase() === "mastercard" ||
                cardType.toLowerCase() === "visa"
              ) {
                file.mcVisaTotal += parseFloat(
                  vArray.valueObject["Amount"].valueString
                    ? Number(
                        vArray.valueObject["Amount"].valueString.replace(
                          /[^0-9.-]+/g,
                          ""
                        )
                      )
                    : 0
                );

                file.mcVisaTransactionCountTotal += parseFloat(
                  vArray.valueObject["Items"].valueString
                    ? Number(
                        vArray.valueObject["Items"].valueString.replace(
                          /[^0-9.-]+/g,
                          ""
                        )
                      )
                    : 0
                );
              } else if (cardType.toLowerCase().includes("amex")) {
                file.amex = vArray.valueObject["Amount"].valueString
                  ? Number(
                      vArray.valueObject["Amount"].valueString.replace(
                        /[^0-9.-]+/g,
                        ""
                      )
                    )
                  : 0;

                file.amexTransactionCountTotal += parseFloat(
                  vArray.valueObject["Items"].valueString
                    ? Number(
                        vArray.valueObject["Items"].valueString.replace(
                          /[^0-9.-]+/g,
                          ""
                        )
                      )
                    : 0
                );
              }
            });
            // Process Fees
            file.feeInfo = [];
            file.mcVisaFeeTotal = 0.0;
            file.amexFeeTotal = 0.0;
            if (
              response.data.analyzeResult.documents[0].fields["Fees Charged"]
                .valueArray &&
              response.data.analyzeResult.documents[0].fields["Fees Charged"]
                .valueArray.length > 0
            ) {
              response.data.analyzeResult.documents[0].fields[
                "Fees Charged"
              ].valueArray.forEach((vArray, index) => {
                let cardType = "na";
                let description =
                  vArray.valueObject["Description"].valueString ?? "unknown";

                if (
                  description.toLowerCase().startsWith("mastercard") ||
                  description.toLowerCase().startsWith("mc") ||
                  description.toLowerCase().startsWith("visa") ||
                  description.toLowerCase().startsWith("vi")
                ) {
                  cardType = "vm";
                } else if (description.toLowerCase().startsWith("amex")) {
                  cardType = "am";
                }

                file.feeInfo.push({
                  description:
                    vArray.valueObject["Description"].valueString ?? "unknown",
                  type: vArray.valueObject["Type"].valueString ?? "unknown",
                  amount: vArray.valueObject["Amount"].content ?? "unknown",
                  cardType,
                  key: index,
                });
              });
            }
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
        "https://borgcollectivehackathon22.cognitiveservices.azure.com/formrecognizer/documentModels/ComposeModel:analyze?api-version=2022-08-31",
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

  const calculateFeeSummary = (file) => {
    let mcVisaFeeTotal = 0;
    let amexFeeTotal = 0;
    file.feeInfo.forEach((fee) => {
      if (fee.cardType === "vm") {
        mcVisaFeeTotal += parseFloat(
          fee.amount ? Number(fee.amount.replace(/[^0-9.-]+/g, "")) : 0
        );
      } else if (fee.cardType === "ax") {
        amexFeeTotal += parseFloat(
          fee.amount ? Number(fee.amount.replace(/[^0-9.-]+/g, "")) : 0
        );
      }
    });

    return (
      <>
        <p>
          {"Mastercard/Visa Total: " +
            (mcVisaFeeTotal !== 0
              ? formatter.format(mcVisaFeeTotal * -1)
              : formatter.format(0))}
        </p>
        <p>
          {"American Express Total: " +
            (amexFeeTotal !== 0
              ? formatter.format(amexFeeTotal * -1)
              : formatter.format(0))}
        </p>
      </>
    );
  };

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",

    // These options are needed to round to whole numbers if that's what you want.
    minimumFractionDigits: 2, // (this suffices for whole numbers, but will print 2500.10 as $2,500.1)
    maximumFractionDigits: 2, // (causes 2500.99 to be printed as $2,501)
  });

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
            {uploadedFiles.map((file, index) => (
              <div key={file.url} className="mt-5 bg-slate-100 rounded-lg">
                <div className="flex flex-col">
                  <div className="flex justify-between p-4">
                    {file.merchantName ? (
                      <div>
                        <div> {file.merchantName} </div>
                        {file.statementDate ? (
                          <div> {"Statement Date: " + file.statementDate} </div>
                        ) : null}
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
                      <VegaCard padding="size-24" margin="size-8">
                        <h1 className="text-xl">
                          <strong>Transaction Summary</strong>
                        </h1>
                        <p>
                          {"Mastercard/Visa Total: " +
                            (file.mcVisaTotal !== 0
                              ? formatter.format(file.mcVisaTotal)
                              : formatter.format(0))}
                        </p>
                        <p>
                          {`Mastercard/Visa Transaction Total: ${file.mcVisaTransactionCountTotal}`}
                        </p>
                        <p>
                          {"American Express Total: " +
                            (file.amex !== 0
                              ? formatter.format(file.amex)
                              : formatter.format(0))}
                        </p>
                        <p>
                          {`American Express Transaction Total: ${file.amexTransactionCountTotal}`}
                        </p>
                      </VegaCard>
                      <StatmentTable
                        title="Transaction Summary Details"
                        data={{ id: index, data: file.baseInfo }}
                        columnType={CARD_SUMMARY_COLUMNS}
                        //onChange={() => {}}
                      />
                    </div>
                  )}
                  {file.feeInfo && file.feeInfo.length > 0 && (
                    <div className="p-4 border-t-2 border-slate-200">
                      <VegaCard padding="size-24" margin="size-8">
                        <h1 className="text-xl">
                          <strong>Fee Summary</strong>
                        </h1>
                        {calculateFeeSummary(file)}
                      </VegaCard>
                      <StatmentTable
                        title="Fee Summary Details"
                        data={{ id: index, data: file.feeInfo }}
                        columnType={FEES_CHARGED_COLUMNS}
                        onChange={(id, value, record) => {
                          const file = uploadedFiles[id];
                          const feeInfo = file.feeInfo.find(
                            (e) => e.key === record.key
                          );
                          feeInfo.cardType = value;

                          const newFiles = uploadedFiles.map((file, index) => {
                            if (id === index) {
                              const feeInfo = file.feeInfo.find(
                                (e) => e.key === record.key
                              );
                              feeInfo.cardType = value;
                              //return feeInfo;
                            }
                            return file;
                          });

                          setUploadedFiles(newFiles);
                        }}
                      />
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
