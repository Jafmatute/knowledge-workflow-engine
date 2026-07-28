import { appInfoSchema, getAppInfoInputSchema, type AppInfo } from '@kwe/schemas';

export function createGetAppInfoHandler(getVersion: () => string) {
  return (input: unknown): AppInfo => {
    getAppInfoInputSchema.parse(input);
    return appInfoSchema.parse({ version: getVersion() });
  };
}
