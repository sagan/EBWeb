import React from "react";

export default function ParserResult({ result }) {
  return (
    <div
      className="parser-result-content parser-default"
      dangerouslySetInnerHTML={{
        __html: result || "",
      }}
    />
  );
}
