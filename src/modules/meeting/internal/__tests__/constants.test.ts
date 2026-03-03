import { describe, it, expect } from "vitest";
import {
  isAllowedFile,
  isWithinSizeLimit,
  MAX_FILE_SIZE,
} from "../constants";

describe("파일 업로드 검증", () => {
  describe("isAllowedFile", () => {
    it("mp3 파일을 허용한다", () => {
      expect(isAllowedFile("test.mp3", "audio/mpeg")).toBe(true);
    });

    it("m4a 파일을 허용한다", () => {
      expect(isAllowedFile("test.m4a", "audio/mp4")).toBe(true);
    });

    it("wav 파일을 허용한다", () => {
      expect(isAllowedFile("test.wav", "audio/wav")).toBe(true);
    });

    it("mp4 파일을 허용한다", () => {
      expect(isAllowedFile("test.mp4", "video/mp4")).toBe(true);
    });

    it("mov 파일을 허용한다", () => {
      expect(isAllowedFile("test.mov", "video/quicktime")).toBe(true);
    });

    it("txt 파일을 거부한다", () => {
      expect(isAllowedFile("test.txt", "text/plain")).toBe(false);
    });

    it("exe 파일을 거부한다", () => {
      expect(isAllowedFile("test.exe", "application/octet-stream")).toBe(false);
    });

    it("확장자가 맞아도 MIME이 다르면 거부한다", () => {
      expect(isAllowedFile("test.mp3", "text/plain")).toBe(false);
    });
  });

  describe("isWithinSizeLimit", () => {
    it("500MB 이하를 허용한다", () => {
      expect(isWithinSizeLimit(100 * 1024 * 1024)).toBe(true);
    });

    it("정확히 500MB를 허용한다", () => {
      expect(isWithinSizeLimit(MAX_FILE_SIZE)).toBe(true);
    });

    it("500MB 초과를 거부한다", () => {
      expect(isWithinSizeLimit(MAX_FILE_SIZE + 1)).toBe(false);
    });
  });
});
