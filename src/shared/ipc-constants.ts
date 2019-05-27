export enum Message {
  ToggleLibsMenuAction = 'toggle-libs-menu-action',
  ToggleLibs = 'toggle-libs',
  ToggleModulesMenuAction = 'toggle-modules-menu-action',
  ToggleModules = 'toggle-modules',
  LoadProject = 'load-project',
  PrevState = 'prev-state',
  GetMetadata = 'get-metadata',
  GetData = 'get-data',
  NextState = 'next-state',
  GetSymbols = 'get-symbols',
  DirectStateTransition = 'direct-state-transition',
  SaveImage = 'save-image',
  ChangeTheme = 'change-theme',
  ImageData = 'image-data',
  DisableExport = 'disable-export',
  EnableExport = 'enable-export',
  Config = 'config'
}

export enum Status {
  Failure = 0,
  Success = 1
}
