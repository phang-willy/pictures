export type ImageUploadFile = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
};

export type StoredImageAssetFile = {
  width: number;
  height: number;
  webpFileName: string;
  webpPath: string;
  webpUrl: string;
};

export interface ImageAssetStoragePort {
  saveWebp(input: {
    id: string;
    title: string;
    file: ImageUploadFile;
  }): Promise<StoredImageAssetFile>;
  renameWebp(input: {
    id: string;
    title: string;
    currentFileName: string;
  }): Promise<
    Pick<StoredImageAssetFile, "webpFileName" | "webpPath" | "webpUrl">
  >;
  renameWebpFile(input: {
    currentFileName: string;
    nextFileName: string;
  }): Promise<void>;
  deleteWebp(fileName: string): Promise<void>;
}
