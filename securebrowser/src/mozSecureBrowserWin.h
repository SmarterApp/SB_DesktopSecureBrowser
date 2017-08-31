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

#include <windows.h>
#include <tlhelp32.h>
#include <stdio.h>
#include <tchar.h>
#include <psapi.h>
#include <Iphlpapi.h>
#include <Mmdeviceapi.h>

#include <atlbase.h>
#include <sphelper.h>
#include <sapi.h>

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

    nsresult Init();
    nsresult ReInit();
    nsresult ResetCallBack();

    void GetStatus(SPVOICESTATUS *aEventStatus);
    void GetVoice(ISpVoice **aVoice);

    void GetOSEdition();

    // DEBUG
    void PrintPointer(const char* aName, nsISupports* aPointer);


  private:

    virtual ~mozSecureBrowser();

    PRInt32 mNum;

    ISpVoice *mVoice;

    PRBool mInitialized, mListenerInited, mCallBackInited;

    bool mPermissive;

    CComPtr<ISpObjectToken> mLastVoice;

    nsAutoString mStatus, mListenerString, mOSEdition;

    PRInt32 mLastVolume, mPitch, mRate;

    BOOL GetLogonSID(HANDLE hToken, PSID *ppsid);

    nsCOMPtr<nsIPrefBranch> mPrefs;

    IMMDeviceEnumerator *mEnumerator;

};

#endif /* __mozSecureBrowser_h */

