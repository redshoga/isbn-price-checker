import { NextResponse } from "next/server";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

// https://www.ssakihara.com/blog/axios-xml
const parser = new XMLParser({
  ignoreAttributes: false,
  numberParseOptions: {
    leadingZeros: false,
    hex: false,
  },
});

const getQSParamFromURL = (url: string, key: string): string | null => {
  const search = new URL(url).search;
  const urlParams = new URLSearchParams(search);
  return urlParams.get(key);
};

const xmlAxiosClient = axios.create({
  responseType: "document",
  headers: { "Content-Type": "text/xml" },
  transformResponse: [(data) => parser.parse(data)],
});

export type NDLBookInfoResponse = {
  title: string;
  creator: string;
  isbn: string;
};

export async function GET(request: Request) {
  const isbn = getQSParamFromURL(request.url, "isbn");

  if (isbn === null) {
    return NextResponse.json({ message: "ISBNが不正です" }, { status: 400 });
  }

  // https://qiita.com/Limitex/items/ce6549a376e0f89716a9
  const targeUrl = `https://iss.ndl.go.jp/api/sru?operation=searchRetrieve&version=1.2&recordSchema=dcndl&onlyBib=true&recordPacking=xml&query=isbn="${isbn}" AND dpid=iss-ndl-opac`;

  const result = await xmlAxiosClient.get(targeUrl);

  const title =
    result.data.searchRetrieveResponse.records.record.recordData["rdf:RDF"][
      "dcndl:BibResource"
    ]["dcterms:title"];
  const creator =
    result.data.searchRetrieveResponse.records.record.recordData["rdf:RDF"][
      "dcndl:BibResource"
    ]["dc:creator"];

  return NextResponse.json<NDLBookInfoResponse>({
    title,
    creator,
    isbn,
  });
}
