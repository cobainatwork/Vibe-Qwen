import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HotwordsPanel } from "./HotwordsPanel";
import * as api from "./hotwords";

vi.mock("./hotwords");

const mockedApi = vi.mocked(api);

function hw(over: Partial<api.Hotword> = {}): api.Hotword {
  return {
    id: "1",
    term: "台積電",
    note: null,
    enabled: true,
    created_at: "t",
    updated_at: "t",
    ...over,
  };
}

describe("HotwordsPanel", () => {
  afterEach(() => vi.clearAllMocks());

  it("載入時列出 hotwords", async () => {
    mockedApi.listHotwords.mockResolvedValue([hw()]);

    render(<HotwordsPanel />);

    expect(await screen.findByText("台積電")).toBeInTheDocument();
  });

  it("切換 enabled 以目標值呼叫 setHotwordEnabled", async () => {
    mockedApi.listHotwords.mockResolvedValue([hw({ enabled: true })]);
    mockedApi.setHotwordEnabled.mockResolvedValue(hw({ enabled: false }));

    render(<HotwordsPanel />);
    const toggle = await screen.findByRole("checkbox");
    fireEvent.click(toggle);

    await waitFor(() => expect(mockedApi.setHotwordEnabled).toHaveBeenCalledWith("1", false));
  });

  it("新增表單送出呼叫 createHotword", async () => {
    mockedApi.listHotwords.mockResolvedValue([]);
    mockedApi.createHotword.mockResolvedValue(hw({ term: "新詞" }));

    render(<HotwordsPanel />);
    await waitFor(() => expect(mockedApi.listHotwords).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("新增 term"), { target: { value: "新詞" } });
    fireEvent.click(screen.getByRole("button", { name: "新增" }));

    await waitFor(() => expect(mockedApi.createHotword).toHaveBeenCalledWith("新詞", ""));
  });

  it("搜尋輸入以 query 呼叫 listHotwords", async () => {
    mockedApi.listHotwords.mockResolvedValue([]);

    render(<HotwordsPanel />);
    await waitFor(() => expect(mockedApi.listHotwords).toHaveBeenCalled());

    fireEvent.change(screen.getByLabelText("搜尋 Hotword"), { target: { value: "台積" } });

    await waitFor(() => expect(mockedApi.listHotwords).toHaveBeenCalledWith("台積"));
  });

  it("刪除按鈕呼叫 deleteHotword", async () => {
    mockedApi.listHotwords.mockResolvedValue([hw()]);
    mockedApi.deleteHotword.mockResolvedValue();

    render(<HotwordsPanel />);
    fireEvent.click(await screen.findByRole("button", { name: "刪除" }));

    await waitFor(() => expect(mockedApi.deleteHotword).toHaveBeenCalledWith("1"));
  });
});
