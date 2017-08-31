// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************
#ifndef __mozSecureBrowser_h
#define __mozSecureBrowser_h

#if defined(__OBJC__)
#import <Cocoa/Cocoa.h>
#import <AppKit/NSSpeechSynthesizer.h>
#import <AudioToolbox/AudioServices.h>
#endif

#include "mozISecureBrowser.h"

#include "nsCOMPtr.h"
#include "nsAutoPtr.h"
#include "nsStringAPI.h"
#include "nsServiceManagerUtils.h"
#include "nsIPrefService.h"
#include "nsIPrefBranch.h"


class mozSecureBrowser : public mozISecureBrowser
{
  public:
    NS_DECL_ISUPPORTS
    NS_DECL_MOZISECUREBROWSER

    mozSecureBrowser();

#if defined(__OBJC__)
    AudioDeviceID GetDefaultAudioDevice();
#endif

    nsresult Init();
    nsresult InitSpeechSynthesizer();
    nsresult SetUIMode(bool aPermissive);

  // DEBUG
  void PrintPointer(const char* aName, nsISupports* aPointer);
  void Log(const char* aMsg);

  private:

    virtual ~mozSecureBrowser();
#if defined(__OBJC__)
    NSSpeechSynthesizer* mSpeechSynthesizer;
#endif

    nsAutoString mStatus;

    bool mPermissive, mKillProcess, mShutDown, mListenerInitialized;
    int32_t mRate, mPitch;

    nsCOMPtr<nsIPrefBranch> mPrefs;
};

#endif /* __mozSecureBrowser_h */

