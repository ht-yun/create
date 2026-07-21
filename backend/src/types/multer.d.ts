declare module "multer" {
  export interface MulterFile {
    originalname: string;
    mimetype: string;
    size: number;
    path?: string;
    buffer?: Buffer;
  }
  export type FileCallback = (error: Error | null, value: string) => void;
  export function diskStorage(options: {
    destination: (request: unknown, file: MulterFile, callback: FileCallback) => void;
    filename: (request: unknown, file: MulterFile, callback: FileCallback) => void;
  }): unknown;
}
