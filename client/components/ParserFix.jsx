import React from "react";

export default function ParserFix({ result }) {
  if (!result) {
    return <div className="parser-result-content parser-fix"></div>;
  }
  return (
    <div className="parser-result-content parser-fix">
      <table>
        <thead>
          <tr>
            <th className="width30">原文</th>
            <th className="width30">修正内容</th>
            <th className="width40">修正理由</th>
          </tr>
        </thead>
        <tbody>
          {result.map((suggestion, i) => (
            <tr key={i}>
              <td className="width30">{suggestion.word}</td>
              <td className="width30">{suggestion.suggestion}</td>
              <td className="width40">
                {suggestion.rule}
                {!!suggestion.note && ` - ${suggestion.note}`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
