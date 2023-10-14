"use client";

import React, { useEffect, useState } from "react";
import { NDLBookInfoResponse } from "./api/route";

// https://note.com/mangapostjapan/n/n6f55739844d1
const convertToISBN10 = (isbn13: string): string => {
  const isbn10 = isbn13.substring(3, 12);
  let digits = 0;
  for (let i = 0; i < isbn10.length; i++) {
    digits += Number(isbn10.charAt(i)) * (10 - i);
  }
  digits = 11 - (digits % 11);
  if (10 == digits) return isbn10 + "X";
  if (11 == digits) return isbn10 + "0";
  return isbn10 + String(digits);
};

const amazonLink = (isbn: string) => `http://www.amazon.co.jp/dp/${isbn}`;
const mercariLink = (keyword: string) =>
  `https://jp.mercari.com/search?keyword=${keyword}`;

const useWindow = () => {
  const [windowObj, setWindowObj] = useState<Window | null>(null);

  const openWindowOption =
    "toolbar=yes,menubar=yes,scrollbars=yes,width=800,height=800";
  const openWindow = (url: string) =>
    window.open(url, undefined, openWindowOption);

  return {
    open: (url: string) => {
      if (windowObj === null) {
        const newWindow = openWindow(url);
        setWindowObj(newWindow);
      } else {
        windowObj.location.href = url;
      }
    },
    close: () => {
      if (windowObj) {
        windowObj.close();
      }
    },
  };
};

const useSelectableWindow = (defaultValue: boolean) => {
  const windowHook = useWindow();
  const [enabled, setEnabled] = useState<boolean>(defaultValue);

  useEffect(() => {
    if (enabled === false) windowHook.close();
  }, [enabled]);

  return {
    state: {
      enabled,
    },
    actions: {
      open: (url: string) => {
        if (enabled) windowHook.open(url);
      },
      setEnabled,
    },
  };
};

export default function Home() {
  const [targetISBN, setTargetISBN] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const mercariWindow = useSelectableWindow(true);
  const amazonWindow = useSelectableWindow(true);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing || e.key !== "Enter") return;

    let normalizedISBN = targetISBN.trim();
    if (normalizedISBN.length !== 10 && normalizedISBN.length !== 13) {
      setErrorMessage("10桁または13桁を入力してください。");
      return;
    }

    setTargetISBN("");
    setErrorMessage(null);

    // Amazon
    amazonWindow.actions.open(
      amazonLink(
        normalizedISBN.length === 13
          ? convertToISBN10(normalizedISBN)
          : normalizedISBN
      )
    );

    // Mercari
    fetch(`/api?isbn=${normalizedISBN}`)
      .then((response) => response.json())
      .then((data) => {
        const responseBody = data as NDLBookInfoResponse;
        mercariWindow.actions.open(mercariLink(responseBody.title));
      })
      .catch((error) => {
        setErrorMessage(error.message || "APIでエラーが発生しました");
      });
  };

  return (
    <main className="container p-8 flex flex-col gap-4">
      <h1 className="text-3xl font-extrabold">ISBN Price Checker</h1>

      <div>
        <label className="block">
          <input
            type="checkbox"
            checked={amazonWindow.state.enabled}
            onChange={() => amazonWindow.actions.setEnabled((v) => !v)}
          />
          <span className="ml-1">Amazonの商品ページを開く</span>
        </label>
        <label className="block">
          <input
            type="checkbox"
            checked={mercariWindow.state.enabled}
            onChange={() => mercariWindow.actions.setEnabled((v) => !v)}
          />
          <span className="ml-1">メルカリの検索結果を開く</span>
        </label>
      </div>

      <span className="text-sm text-gray-800">
        <a
          href="https://amzn.asia/d/1lLmjnq"
          className="text-blue-800 underline"
        >
          バーコードリーダー
        </a>
        を用いると入力の効率があがります。
      </span>

      <input
        autoFocus
        placeholder="9780123412340"
        className="border-4 border-solid border-black p-2 rounded-md w-[300px]"
        type="text"
        value={targetISBN}
        onChange={(e) => setTargetISBN(e.target.value)}
        onKeyDown={handleKeyDown}
      />

      {errorMessage && <div>{errorMessage}</div>}
    </main>
  );
}
