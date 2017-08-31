// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************
#include "mozilla/ModuleUtils.h"

#ifdef XP_MACOSX
  #include "mozSecureBrowserOSX.h"
#endif

#ifdef XP_WIN
  #include "mozSecureBrowserWin.h"
#endif

#ifdef XP_UNIX
  #include "mozSecureBrowserLinux.h"
#endif


NS_GENERIC_FACTORY_CONSTRUCTOR_INIT(mozSecureBrowser, Init)

// {E607BE99-1CF4-4FE1-BCDC-502C6F867ECB}
#define MOZ_SECUREBROWSER_CID \
{ 0xE607BE99, 0x1CF4, 0x4FE1, { 0xBC, 0xDC, 0x50, 0x2C, 0x6F, 0x86, 0x7E, 0xCB } }

NS_DEFINE_NAMED_CID(MOZ_SECUREBROWSER_CID);

static const mozilla::Module::CIDEntry kSecureBrowserCIDs[] = {
    { &kMOZ_SECUREBROWSER_CID, false, nullptr, mozSecureBrowserConstructor },
    { nullptr }
};

static const mozilla::Module::ContractIDEntry kSecureBrowserContracts[] = {
    { MOZ_SECUREBROWSER_CONTRACT_ID, &kMOZ_SECUREBROWSER_CID },
    { nullptr }
};

static const mozilla::Module::CategoryEntry kSecureBrowserCategories[] = {
    { "Runtime", "securebrowser", MOZ_SECUREBROWSER_CONTRACT_ID },
    { nullptr }
};

static const mozilla::Module kSecureBrowserModule = {
    mozilla::Module::kVersion,
    kSecureBrowserCIDs,
    kSecureBrowserContracts,
    kSecureBrowserCategories
};

NSMODULE_DEFN(mozSecureBrowserModule) = &kSecureBrowserModule;

