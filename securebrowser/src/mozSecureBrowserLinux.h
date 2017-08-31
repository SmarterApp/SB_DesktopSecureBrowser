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

    void GetShellScript(nsAString & aName, FILE **aFp);
    void GetShellScript(nsAString & aName, nsAString & params, FILE **aFp);
    bool ShellScriptExists(nsAString & aName);
    int GetCards();

    nsresult Init();
    nsresult GetShellScriptOutputAsAString(nsAString & aName, nsAString &_retval);
    nsresult GetShellScriptOutputAsJSObject(nsAString & aName, nsAString &_retval);
    nsresult SynthesizeToSpeech(const nsAString &aText, const nsAString &aPath);

    nsresult GetSystemVolumeInternal(int32_t aCardNumber, int32_t *aVolume);
    nsresult SetSystemVolumeInternal(int32_t aCardNumber, int32_t aVolume);
    nsresult SetSystemHeadphoneVolumeInternal(int32_t aCardNumber, int32_t aVolume);

    nsresult PlayInternal(const nsAString & aPath);

    // DEBUG
    void PrintPointer(const char* aName, nsISupports* aPointer);

  private:
    virtual ~mozSecureBrowser();

    int32_t mNum, mVol, mLastMuteVol, mPitchInt;
    bool mSoxKludge, mSystemMute, mSystemCall, mIs64BitOS, mUseStoredVoiceName;

    char mRateChar[24];

    nsAutoString mStatus, mRate, mPitch, mSoxVersion, mPlayCmd, mStartVoice, mVoiceName;

    nsCOMPtr<nsIFile> mWavFile;
    nsCOMPtr<nsIPrefBranch> mPrefs;
};

#endif /* __mozSecureBrowser_h */

