export type ImageAssetEntityProps = {
  id: string;
  title: string;
  originalFileName: string;
  sourceMimeType: string;
  sourceSizeBytes: number;
  width: number;
  height: number;
  webpFileName: string;
  webpPath: string;
  webpUrl: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ImageAssetEntity {
  constructor(private readonly props: ImageAssetEntityProps) {}

  get id() {
    return this.props.id;
  }

  get title() {
    return this.props.title;
  }

  get webpFileName() {
    return this.props.webpFileName;
  }

  toPrimitives(): ImageAssetEntityProps {
    return { ...this.props };
  }
}
