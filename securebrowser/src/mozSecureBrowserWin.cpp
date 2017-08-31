// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************
// SB header file
#include "mozSecureBrowserWin.h"
#include "stdio.h"
#include <math.h>
#include <direct.h>
#include <EndpointVolume.h>

#include <VersionHelpers.h>

// Mozilla includes
#include "nsEmbedString.h"
#include "nsIClassInfoImpl.h"
#include "nsIObserverService.h"

#pragma comment(lib, "User32.lib")

#define BUFSIZE 256

typedef void (WINAPI *PGNSI)(LPSYSTEM_INFO);
typedef BOOL (WINAPI *PGPI)(DWORD, DWORD, DWORD, DWORD, PDWORD);

// #define DEBUG_PETE 1

void PrintLogMsg2 (char *aMsg)
{

#ifndef DEBUG_PETE
  return;
#endif

  _mkdir("c:\\tmp");

  char path[MAX_PATH] = "c:\\tmp\\out.log";

  FILE* mLog;
  mLog = fopen(path, "a");

  fprintf(mLog, "LOG MESSAGE: (%s)\n", aMsg);
  // fflush(mLog);

  fclose(mLog);
}

void PrintLogMsg2 (nsAString& aMsg)
{

#ifndef DEBUG_PETE
  return;
#endif

  _mkdir("c:\\tmp");

  nsAutoString s(aMsg);

  char path[MAX_PATH] = "c:\\tmp\\out.log";

  FILE* mLog;
  mLog = fopen(path, "a");

  fprintf(mLog, "-------- LOG MESSAGE: (%s) --------\n", NS_ConvertUTF16toUTF8(s).get());
  // fflush(mLog);

  fclose(mLog);
}

static bool IsWin8OrGreater()
{
  OSVERSIONINFOEX osvi;

  ZeroMemory(&osvi, sizeof(OSVERSIONINFOEX));

  osvi.dwOSVersionInfoSize = sizeof(OSVERSIONINFOEX);

  GetVersionEx((OSVERSIONINFO *) &osvi);

  return (osvi.dwMajorVersion == 6 && osvi.dwMinorVersion >= 2);
}


mozSecureBrowser::mozSecureBrowser() : 
    mVoice(NULL),
    mPitch(0),
    mRate(-1),
    mLastVolume(10),
    mInitialized(PR_FALSE),
    mListenerInited(PR_FALSE),
    mCallBackInited(PR_FALSE)
{
  // printf("-------- mozSecureBrowser::CREATE --------\n");

  if (FAILED(::CoInitialize(NULL)))
  {
    mInitialized = PR_FALSE;
    PrintLogMsg2("FAILED TO CoInitialize ...");
  }
    else
  {
    mInitialized = PR_TRUE;
    SetVolume(10);
  }


  CoCreateInstance(__uuidof(MMDeviceEnumerator), NULL, CLSCTX_INPROC_SERVER, __uuidof(IMMDeviceEnumerator), (void**)&mEnumerator);

  mPrefs = do_GetService(NS_PREFSERVICE_CONTRACTID);

  // get these prefs so we can then reset back after using permissive mode
  // mPrefs->GetBoolPref("securebrowser.mode.permissive", &mPermissive);

  mPermissive = PR_FALSE;

  mStatus.Assign(NS_LITERAL_STRING("Stopped"));
}

mozSecureBrowser::~mozSecureBrowser() 
{
  // printf("-------- mozSecureBrowser::DESTROY --------\n");

  ::CoUninitialize();

  if (mVoice)
  {
    mVoice->SetNotifySink(NULL);
    mVoice->Release();
    mVoice = NULL;
  }
}

NS_IMPL_ISUPPORTS(mozSecureBrowser, mozISecureBrowser)


static void __stdcall SBSpeechCallBack(WPARAM wParam, LPARAM lParam)
{
  nsAutoString msg;

  /********
  if (wParam == SPEI_START_INPUT_STREAM) msg.Assign(NS_LITERAL_STRING("SPEI_START_INPUT_STREAM"));
  if (wParam == SPEI_END_INPUT_STREAM) msg.Assign(NS_LITERAL_STRING("SPEI_END_INPUT_STREAM"));
  if (wParam == SPEI_VOICE_CHANGE) msg.Assign(NS_LITERAL_STRING("SPEI_VOICE_CHANGE"));
  if (wParam == SPEI_PHONEME) msg.Assign(NS_LITERAL_STRING("SPEI_PHONEME"));
  if (wParam == SPEI_SENTENCE_BOUNDARY) msg.Assign(NS_LITERAL_STRING("SPEI_SENTENCE_BOUNDARY"));
  if (wParam == SPEI_VISEME) msg.Assign(NS_LITERAL_STRING("SPEI_VISEME"));
  if (wParam == SPEI_TTS_AUDIO_LEVEL) msg.Assign(NS_LITERAL_STRING("SPEI_TTS_AUDIO_LEVEL"));
  ********/


  if (lParam) 
  {
    CSpEvent spevent;
    ISpVoice *voice;

    ((mozSecureBrowser*)lParam)->GetVoice(&voice);

    if (voice)
    {
      SPEVENT eventItem;
      memset(&eventItem, 0, sizeof(SPEVENT));

      nsCOMPtr<nsIObserverService> observerService = do_GetService("@mozilla.org/observer-service;1");

      while(voice->GetEvents(1, &eventItem, NULL) == S_OK )
      {
        switch(eventItem.eEventId )
        {
          case SPEI_START_INPUT_STREAM:
          {
            msg.Assign(NS_LITERAL_STRING("Start"));
            // printf("SPEI_START_INPUT_STREAM\n");
            break;
          }

          case SPEI_SENTENCE_BOUNDARY:
          {
            msg.Assign(NS_LITERAL_STRING("SentenceStart"));
            // printf("SPEI_SENTENCE_BOUNDARY\n");
            break;
          }

          case SPEI_TTS_BOOKMARK:
          {
            msg.Assign(NS_LITERAL_STRING("Sync"));
            // printf("SPEI_TTS_BOOKMARK\n");
            break;
          }

          case SPEI_END_INPUT_STREAM:
          {
            msg.Assign(NS_LITERAL_STRING("Done"));
            // printf("SPEI_END_INPUT_STREAM\n");
            break;
          }

          case SPEI_WORD_BOUNDARY:
          {
            SPVOICESTATUS eventStatus;
            voice->GetStatus(&eventStatus, NULL);

            msg.Assign(NS_LITERAL_STRING("WordStart:"));

            ULONG inWordPos, inWordLen, offset;
            inWordPos = eventStatus.ulInputWordPos;
            inWordLen = eventStatus.ulInputWordLen;

            // there appears to be an 18 char offset ...
            if (inWordPos == 0) offset = 0;
            else offset = inWordPos - 18;

            PRInt64 start = offset;
            msg.AppendInt(start);

            msg.Append(NS_LITERAL_STRING(", WordLength:"));

            PRInt64 length = inWordLen;
            msg.AppendInt(length);
            // printf("SPEI_WORD_BOUNDARY start(%lld) len(%lld)\n", start, length);
            break;
          }

          case SPEI_PHONEME:
          {
            msg.Assign(NS_LITERAL_STRING("Phoneme"));
            // printf("SPEI_PHONEME\n");
            break;
          }

          default:
            break;
        }

        observerService->NotifyObservers(nullptr, "sb-word-speak", msg.get());
      }
    }
  }
}

nsresult
mozSecureBrowser::Init()
{
  if (!mVoice) Initialize();

  return NS_OK;
}

nsresult
mozSecureBrowser::ReInit()
{
  if (mVoice) return NS_OK;
 
  nsresult rv = Initialize();

  if (NS_FAILED(rv)) return rv;

  if (mLastVolume >= 0) SetVolume(mLastVolume);

  if (mLastVoice) mVoice->SetVoice(mLastVoice);

  if (mRate >= 0) SetRate(mRate);

  return NS_OK;
}

nsresult
mozSecureBrowser::ResetCallBack()
{
  mCallBackInited = PR_FALSE;

  return NS_OK;
}


NS_IMETHODIMP
mozSecureBrowser::GetVersion(nsAString & aVersion)
{
  aVersion = NS_LITERAL_STRING(MOZ_APP_UA_VERSION);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetAllProcesses(nsAString & _retval) 
{
  HANDLE hProcessSnap;
  PROCESSENTRY32 pe32;
  nsAutoString out;

  // Take a snapshot of all processes in the system.
  hProcessSnap = CreateToolhelp32Snapshot( TH32CS_SNAPPROCESS, 0 );
  if ( hProcessSnap == INVALID_HANDLE_VALUE )
  {
    printf("-------- CreateToolhelp32Snapshot (of processes) failed --------");
  } 
    else 
  {
    // Set the size of the structure before using it.
    pe32.dwSize = sizeof( PROCESSENTRY32 );

    // Retrieve information about the first process,
    // and exit if unsuccessful
    if ( !Process32First( hProcessSnap, &pe32 ) )
    {
      CloseHandle( hProcessSnap );          // clean the snapshot object    
    } 
      else 
    {
      // Now walk the snapshot of processes, and
      // display information about each process in turn    
      do
      {
        HANDLE hProcess;

        if (IsWindowsVistaOrGreater())
          hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pe32.th32ProcessID);
        else
          hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pe32.th32ProcessID);

        if (hProcess)
        {
          if (out.Length()) out.Append(NS_LITERAL_STRING(","));
          nsAutoString processName(NS_ConvertUTF8toUTF16(pe32.szExeFile).get());
          out.Append(processName);  

          // get the name of the parent process
          char parentProcName[2048];

          HANDLE parentProcess;

          if (IsWindowsVistaOrGreater())
            parentProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pe32.th32ParentProcessID);
          else
            parentProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pe32.th32ParentProcessID);

          out.Append(NS_LITERAL_STRING("|"));

          if (parentProcess)
          {
            nsAutoString parentProcessName;

            if (GetProcessImageFileName(parentProcess, parentProcName, sizeof(parentProcName)) > 0)
              parentProcessName.AppendLiteral(parentProcName);  

              if (!parentProcessName.IsEmpty()) out.Append(parentProcessName);  
              else out.Append(NS_LITERAL_STRING("noname"));

            CloseHandle(parentProcess);
          }
            else
          {
            out.Append(NS_LITERAL_STRING("unavailable"));
          }

          CloseHandle(hProcess);
        } 
      } 

      while( Process32Next( hProcessSnap, &pe32 ) );

      CloseHandle( hProcessSnap );
    }
  }

  _retval = out;


  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetRunningProcessList(nsAString & _retval) 
{
  // abort();
  HANDLE hProcessSnap;
  PROCESSENTRY32 pe32;
  nsAutoString out;

  // Take a snapshot of all processes in the system.
  hProcessSnap = CreateToolhelp32Snapshot( TH32CS_SNAPPROCESS, 0 );
  if ( hProcessSnap == INVALID_HANDLE_VALUE )
  {
    printf("-------- CreateToolhelp32Snapshot (of processes) failed --------");
  } 
    else 
  {
    // Set the size of the structure before using it.
    pe32.dwSize = sizeof( PROCESSENTRY32 );

    // Retrieve information about the first process,
    // and exit if unsuccessful
    if ( !Process32First( hProcessSnap, &pe32 ) )
    {
      CloseHandle( hProcessSnap );          // clean the snapshot object    
    } 
      else 
    {
      // Now walk the snapshot of processes, and
      // display information about each process in turn    
      do
      {
        HANDLE hProcess;

        if (IsWindowsVistaOrGreater())
          hProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pe32.th32ProcessID);
        else
          hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pe32.th32ProcessID);

        if (hProcess)
        {
          // if (out.Length()) out.Append(NS_LITERAL_STRING(","));
          nsAutoString processName(NS_ConvertUTF8toUTF16(pe32.szExeFile).get());

          processName.Replace(0, processName.RFind("\\")+1, NS_LITERAL_STRING(""));


          if (out.Find(processName) == -1) 
          {
            if (out.Length()) out.Append(NS_LITERAL_STRING(","));
            // printf("processName [%s] Length[%d]\n", NS_ConvertUTF16toUTF8(processName).get(), processName.Length());
            out.Append(processName);  
          }

          // get the name of the parent process
          char parentProcName[2048];

          HANDLE parentProcess;

          if (IsWindowsVistaOrGreater())
            parentProcess = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, FALSE, pe32.th32ParentProcessID);
          else
            parentProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, pe32.th32ParentProcessID);

          // out.Append(NS_LITERAL_STRING("|"));

          if (parentProcess)
          {
            nsAutoString parentProcessName;

            if (GetProcessImageFileName(parentProcess, parentProcName, sizeof(parentProcName)) > 0)
              parentProcessName.AppendLiteral(parentProcName);  

              if (!parentProcessName.IsEmpty()) 
              {
                parentProcessName.Replace(0, parentProcessName.RFind("\\")+1, NS_LITERAL_STRING(""));

                // printf("%d\n", out.Find(parentProcessName));
                // printf("parentProcessName [%s]\n", NS_ConvertUTF16toUTF8(parentProcessName).get());

                // add the parent if process name has not already been added
                if (out.Find(parentProcessName) == -1) 
                {
                  // printf("ParentProcessName [%s] Length[%d]\n", NS_ConvertUTF16toUTF8(parentProcessName).get(), parentProcessName.Length());
                  out.Append(NS_LITERAL_STRING(","));
                  out.Append(parentProcessName);  
                } 
              }
                else out.Append(NS_LITERAL_STRING("noname"));

            CloseHandle(parentProcess);
          }
          /********
            else
          {
            out.Append(NS_LITERAL_STRING("unavailable"));
          }
          ********/

          CloseHandle(hProcess);
        } 
      } 

      while( Process32Next( hProcessSnap, &pe32 ) );

      CloseHandle( hProcessSnap );
    }
  }

  _retval = out;


  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetServices(nsAString & _retval)
{
  SC_HANDLE hSCM    = NULL;
  PUCHAR  pBuf    = NULL;
  ULONG  dwBufSize   = 0x00;
  ULONG  dwBufNeed   = 0x00;
  ULONG  dwNumberOfService = 0x00;


  LPENUM_SERVICE_STATUS_PROCESS pInfo = NULL;


  hSCM = OpenSCManager(NULL, NULL, SC_MANAGER_ENUMERATE_SERVICE | SC_MANAGER_CONNECT);


  if (hSCM == NULL)
  {
    printf_s("OpenSCManager fail \n");
    return NS_ERROR_FAILURE;
  }


  EnumServicesStatusEx(
   hSCM,
   SC_ENUM_PROCESS_INFO,
   SERVICE_WIN32, // SERVICE_DRIVER
   SERVICE_STATE_ALL,
   NULL,
   dwBufSize,
   &dwBufNeed,
   &dwNumberOfService,
   NULL,
   NULL);


  if (dwBufNeed < 0x01)
  {
   printf_s("EnumServicesStatusEx fail ?? \n");
   return NS_ERROR_FAILURE;
  }


  dwBufSize = dwBufNeed + 0x10;
  pBuf  = (PUCHAR) malloc(dwBufSize);


  EnumServicesStatusEx(
   hSCM,
   SC_ENUM_PROCESS_INFO,
   SERVICE_WIN32,  // SERVICE_DRIVER,
   SERVICE_ACTIVE,  //SERVICE_STATE_ALL,
   pBuf,
   dwBufSize,
   &dwBufNeed,
   &dwNumberOfService,
   NULL,
   NULL);


  pInfo = (LPENUM_SERVICE_STATUS_PROCESS)pBuf;
  nsAutoString processName;
  for (ULONG i=0;i<dwNumberOfService;i++)
  {
    if (processName.Length()) processName.Append(NS_LITERAL_STRING(","));
    processName.AppendLiteral(T2A(pInfo[i].lpDisplayName));
    // printf("Display Name : %s \n", T2A(pInfo[i].lpDisplayName));
    // wprintf_s(L"Display Name \t : %s \n", pInfo[i].lpDisplayName);
    // wprintf_s(L"Service Name \t : %s \n", pInfo[i].lpServiceName);
    // wprintf_s(L"Process Id \t : %04x (%d) \n", pInfo[i].ServiceStatusProcess.dwProcessId, pInfo[i].ServiceStatusProcess.dwProcessId);
  }


  free(pBuf);


  CloseServiceHandle(hSCM);

  _retval.Assign(processName);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetMACAddress(nsAString & _retval)
{
  // PrintLogMsg2("mozSecureBrowser::GetMACAddress"); 

  ULONG BufferLength = 0;
  BYTE* pBuffer = 0;

  if ( ERROR_BUFFER_OVERFLOW == GetAdaptersInfo( 0, &BufferLength ))
  {
    // Now the BufferLength contain the required buffer length.
    // Allocate necessary buffer.
    pBuffer = new BYTE[ BufferLength ];
  }
    else
  {
    // Error occurred. handle it accordingly.
    PrintLogMsg2("mozSecureBrowser::GetMACAddress:ERROR"); 

    return NS_ERROR_FAILURE;
  }

  // Get the Adapter Information.
  PIP_ADAPTER_INFO pAdapterInfo =
      reinterpret_cast<PIP_ADAPTER_INFO>(pBuffer);
  GetAdaptersInfo( pAdapterInfo, &BufferLength );

  char out[256];

  // Iterate the network adapters and print their MAC address.
  while( pAdapterInfo )
  {
    // Assuming pAdapterInfo->AddressLength is 6.

    sprintf(out, "%02x:%02x:%02x:%02x:%02x:%02x", pAdapterInfo->Address[0], pAdapterInfo->Address[1], 
                                                  pAdapterInfo->Address[2], pAdapterInfo->Address[3], 
                                                  pAdapterInfo->Address[4], pAdapterInfo->Address[5] );

    break;
  }

  // printf("MAC ADDRESS: (%s)\n", out);

  // deallocate the buffer.
  delete[] pBuffer;

  _retval = NS_ConvertUTF8toUTF16(out).get();

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Initialize()
{
  if (!mVoice) 
  {
    HRESULT hr = CoCreateInstance(CLSID_SpVoice, NULL, CLSCTX_ALL, IID_ISpVoice, (void **)&mVoice);

    if (FAILED(hr))
    {
      // PrintLogMsg2("FAILED TO INITIALIZE VOICE ...");

      return NS_ERROR_NOT_INITIALIZED;
    }
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Uninitialize()
{
  // PrintLogMsg2("mozSecurebrowser::Uninitialize"); 

  if (mVoice)
  {
    mVoice->SetNotifySink(NULL);
    mVoice->Release();
    mVoice = NULL;
  }

  ::CoUninitialize();

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::InitializeListener(const nsAString & aType)
{
  nsresult rv = NS_OK;

  if (mListenerInited) return rv;

  mListenerString.Assign(aType);
  mListenerInited = PR_TRUE;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Play(const nsAString & text)
{
  if (!mInitialized) return NS_ERROR_NOT_INITIALIZED;

  if (text.IsEmpty()) return NS_OK;

  mCallBackInited = PR_FALSE;

  HRESULT hr;
  nsresult rv;

  Stop();

  if (!mVoice) 
  {
    rv = Initialize();

    if (NS_FAILED(rv)) return rv;
  }

  // Set the audio format
  if (mVoice)
  {
    char buf[33];
    itoa(mPitch, buf, 10);

    // to get pitch to work we need to wrap it in an XML <pitch> tag
    nsAutoString s(NS_LITERAL_STRING("<pitch middle=\""));
    s.Append(NS_ConvertUTF8toUTF16(buf));
    s.Append(NS_LITERAL_STRING("\">"));
    s.Append(text);
    s.Append(NS_LITERAL_STRING("</pitch>"));

    // PrintLogMsg2(s);

    mStatus.Assign(NS_LITERAL_STRING("Playing"));

    if (mLastVolume >= 0) SetVolume(mLastVolume);

    if (mLastVoice) hr = mVoice->SetVoice(mLastVoice);

    if (mRate >= 0) SetRate(mRate);
     
    // printf("mCallBackInited (%s)\n", mCallBackInited ? "TRUE" : "FALSE");

    if (!mCallBackInited)
    {
      hr = mVoice->SetNotifySink(NULL);

      /** Potential Listener types
       * //--- TTS engine
       *  SPEI_START_INPUT_STREAM,
       *  SPEI_END_INPUT_STREAM,
       *  SPEI_VOICE_CHANGE,
       *  SPEI_TTS_BOOKMARK,
       *  SPEI_WORD_BOUNDARY,
       *  SPEI_PHONEME,
       *  SPEI_SENTENCE_BOUNDARY,
       *  SPEI_VISEME,
       *  SPEI_TTS_AUDIO_LEVEL
       */


      PrintLogMsg2(mListenerString);

      ULONGLONG type;
      WPARAM data;

      // remove existing callback
      mVoice->SetNotifySink(NULL);

      if (!mCallBackInited)
        hr = mVoice->SetNotifyCallbackFunction(SBSpeechCallBack, NULL, (LPARAM)this);

      if (!SUCCEEDED(hr)) PrintLogMsg2("SetNotifyCallbac FAILED ...");
      else PrintLogMsg2("SUCCESS: SetNotifyCallbackFunction"); 

      type = SPFEI(SPEI_SENTENCE_BOUNDARY)|SPFEI(SPEI_PHONEME)|SPFEI(SPEI_WORD_BOUNDARY)|SPFEI(SPEI_END_INPUT_STREAM)|SPFEI(SPEI_TTS_BOOKMARK)|SPFEI(SPEI_START_INPUT_STREAM);

      hr = mVoice->SetInterest(type, type);

      if (!SUCCEEDED(hr)) 
      {
        PrintLogMsg2("SetInterest FAILED ...");
        return NS_ERROR_FAILURE;
      }
        else PrintLogMsg2("SUCCESS: SetInterest"); 

      mCallBackInited = PR_TRUE;
    }

    hr = mVoice->Speak(s.get(), SPF_ASYNC, NULL);

    if (FAILED(hr)) return NS_ERROR_FAILURE;
  }
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Pause()
{
  if (!mVoice) return NS_OK;

  // PrintLogMsg2(mStatus);

  if (!mStatus.Equals(NS_LITERAL_STRING("Stopped")))
    mStatus.Assign(NS_LITERAL_STRING("Paused"));

  HRESULT hr = mVoice->Pause();

  if (FAILED(hr)) return NS_ERROR_FAILURE;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Stop()
{
  if (!mVoice) return NS_OK;

  HRESULT hr = mVoice->Speak( NULL, SPF_PURGEBEFORESPEAK, 0 );

  mStatus.Assign(NS_LITERAL_STRING("Stopped"));

  // mVoice->Pause();

  if (FAILED(hr)) 
  {
    // PrintLogMsg2("mozSecurebrowser::Stop FAILED"); 

    return NS_ERROR_FAILURE;
  }

  mVoice->Release();
  mVoice = NULL;

  ReInit();

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Resume()
{
  if (!mVoice) return NS_OK;

  if (!mStatus.Equals(NS_LITERAL_STRING("Stopped")))
    mStatus.Assign(NS_LITERAL_STRING("Playing"));

  HRESULT hr = mVoice->Resume();

  if (FAILED(hr)) return NS_ERROR_FAILURE;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetVoiceName(nsAString & _retval)
{
  if (!mVoice) 
  {
    if (mLastVoice) 
    {
      WCHAR *tokenID = NULL;

      mLastVoice->GetId(&tokenID);

      _retval.Assign(tokenID);
    }

    
    return NS_OK;
  }

  ISpObjectToken *pToken;

  HRESULT hr = mVoice->GetVoice(&pToken);

  if (SUCCEEDED(hr)) 
  {
    WCHAR *pszCurTokenId = NULL;
    pToken->GetId(&pszCurTokenId);
    pToken->Release();

    _retval.Assign(pszCurTokenId);
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetVoiceName(const nsAString & aVoiceName)
{
  if (!mVoice) return NS_OK;

  // printf("mozSecurebrowser::SetVoiceName (%s)\n", NS_ConvertUTF16toUTF8(aVoiceName).get()); 

  // fix for issue 11907
  Stop();

  HRESULT hr;

  CComPtr<ISpObjectToken>        cpVoiceToken;
  CComPtr<IEnumSpObjectTokens>   cpEnum;
  ULONG                          ulCount = 0;

  hr = SpEnumTokens(SPCAT_VOICES, NULL, NULL, &cpEnum);

  if (SUCCEEDED (hr))
  {
    // Get the number of voices.
    hr = cpEnum->GetCount(&ulCount);
  }

  nsAutoString out;

  // Obtain a list of available voice tokens, set
  // the voice to the token, and call Speak.
  while (SUCCEEDED(hr) && ulCount--)
  {
    cpVoiceToken.Release();

    if (SUCCEEDED (hr))
    {
      hr = cpEnum->Next(1, &cpVoiceToken, NULL);

      WCHAR *pszCurTokenId = NULL;

      cpVoiceToken->GetId(&pszCurTokenId);

      out.Assign(pszCurTokenId);

      // printf("CURRENT: %s\n", NS_ConvertUTF16toUTF8(out).get());
      // printf("IN: %s\n", NS_ConvertUTF16toUTF8(aVoiceName).get());

      // printf("EQUALS: %d\n", out.Equals(aVoiceName));

      if (out.Equals(aVoiceName))
      {
        hr = mVoice->SetVoice(cpVoiceToken);

        mLastVoice = cpVoiceToken;

        // if (SUCCEEDED (hr)) printf("SetVoice SUCCESS ...\n");
      }
    }
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetVolume(int32_t *_retval)
{
  NS_ENSURE_ARG(_retval);

  if (!mVoice) 
  {
    if (mLastVolume >= 0) *_retval = mLastVolume;
    return NS_OK;
  }

  USHORT volume = 0;

  HRESULT hr = mVoice->GetVolume(&volume);

  *_retval = volume/10;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetVolume(int32_t aVolume)
{
  if (!mVoice) return NS_OK;

  if (aVolume >= 0 && aVolume <= 10) 
  {
    HRESULT hr = mVoice->SetVolume(aVolume*10);

    mLastVolume = aVolume;
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetRate(int32_t *aRate)
{
  if (!mInitialized) 
  {
    // PrintLogMsg2("mozSecurebrowser:GetRate: RETURN NS_ERROR_NOT_INITIALIZED"); 
    return NS_ERROR_NOT_INITIALIZED;
  }

  if (!mVoice) 
  {
    // PrintLogMsg2("mozSecurebrowser:GetRate: mVoice is null ..."); 
    return NS_OK;
  }


  HRESULT hr = mVoice->GetRate((long*)aRate); 

  *aRate = *aRate + 10;

  if (FAILED(hr)) 
  {
    // PrintLogMsg2("mozSecurebrowser:GetRate: GetRate CALL FAILED ..."); 
    return NS_ERROR_FAILURE;
  }


  // PrintLogMsg2("mozSecurebrowser:GetRate: RETURN OK ..."); 

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetRate(int32_t aRate)
{
  if (!mInitialized) 
  {
    // PrintLogMsg2("mozSecurebrowser:SetRate: RETURN NS_ERROR_NOT_INITIALIZED"); 
    return NS_ERROR_NOT_INITIALIZED;
  }

  if (!mVoice) 
  {
    // PrintLogMsg2("mozSecurebrowser:SetRate: mVoice is null ..."); 
    return NS_OK;
  }

  if (aRate > 20) aRate = 20;
  if (aRate < 0) aRate = 0;

  mRate = aRate;

  PRInt32 rate = aRate - 10;

  HRESULT hr = mVoice->SetRate((long)rate); 

  if (FAILED(hr)) 
  {
    // PrintLogMsg2("mozSecurebrowser:SetRate: SetRate CALL FAILED ..."); 
    return NS_ERROR_FAILURE;
  }


  // PrintLogMsg2("mozSecurebrowser:SetRate: RETURN OK ..."); 

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetPitch(int32_t *aPitch)
{
  *aPitch = mPitch + 10;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetPitch(int32_t aPitch)
{
  if (aPitch > 20) aPitch = 20;
  if (aPitch < 0) aPitch = 0;

  mPitch = aPitch - 10;

  return NS_OK;
}

void
mozSecureBrowser::GetStatus(SPVOICESTATUS *aEventStatus)
{

  if (!mVoice) return;

  mVoice->GetStatus(aEventStatus, NULL);  

}

void
mozSecureBrowser::GetVoice(ISpVoice **aVoice)
{

  if (!mVoice) return;

  *aVoice = mVoice;

}
NS_IMETHODIMP
mozSecureBrowser::GetStatus(nsAString & _retval)
{

  if (!mVoice) 
  {
    _retval = NS_LITERAL_STRING("Stopped");
    return NS_OK;
  }

  SPVOICESTATUS status;

  mVoice->GetStatus(&status,NULL);

  if (!mStatus.IsEmpty()) 
  {
    // PrintLogMsg2(mStatus);
    _retval.Assign(mStatus);

    if (!mStatus.Equals(NS_LITERAL_STRING("Stopped")))
      mStatus.Assign(NS_LITERAL_STRING(""));

    return NS_OK;
  }

  if (status.dwRunningState == SPRS_IS_SPEAKING)
    _retval = NS_LITERAL_STRING("Playing");
  else  if (status.dwRunningState == SPRS_DONE)
    _retval = NS_LITERAL_STRING("Stopped");
  else if (status.dwRunningState == 3)
    _retval = NS_LITERAL_STRING("Stopped");
  else
    _retval = NS_LITERAL_STRING("Paused");

  return NS_OK;
}


NS_IMETHODIMP
mozSecureBrowser::GetVoices(nsAString & _retval)
{
  if (!mVoice) return NS_OK;

  HRESULT                        hr = S_OK;
  CComPtr<ISpObjectToken>        cpVoiceToken;
  CComPtr<IEnumSpObjectTokens>   cpEnum;
  ULONG                          ulCount = 0;

  hr = SpEnumTokens(SPCAT_VOICES, NULL, NULL, &cpEnum);

  if (SUCCEEDED (hr))
  {
    // Get the number of voices.
    hr = cpEnum->GetCount(&ulCount);
  }

  nsAutoString out;

  // Obtain a list of available voice tokens, set
  // the voice to the token, and call Speak.
  while (SUCCEEDED(hr) && ulCount--)
  {
    cpVoiceToken.Release();

    if (SUCCEEDED (hr))
    {
      hr = cpEnum->Next(1, &cpVoiceToken, NULL);

      WCHAR *pszCurTokenId = NULL;

      cpVoiceToken->GetId(&pszCurTokenId);

      CComPtr<ISpDataKey> cpKey;
      HRESULT r = cpVoiceToken->OpenKey(L"Attributes", &cpKey);

      if (SUCCEEDED (r))
      {
        WCHAR *str = NULL;
        nsAutoString obj; 

        obj.Assign(NS_LITERAL_STRING("{ name: "));

        r = cpKey->GetStringValue(L"Name", &str);
        if (SUCCEEDED (r)) 
        {
          obj.Append(NS_LITERAL_STRING("'"));
          obj.Append(str);
          obj.Append(NS_LITERAL_STRING("'"));
        }

        obj.Append(NS_LITERAL_STRING(", gender: "));

        r = cpKey->GetStringValue(L"Gender", &str);
        if (SUCCEEDED (r)) 
        {
          obj.Append(NS_LITERAL_STRING("'"));
          obj.Append(str);
          obj.Append(NS_LITERAL_STRING("'"));
        }

        obj.Append(NS_LITERAL_STRING(", lang: "));

        r = cpKey->GetStringValue(L"Language", &str);
        if (SUCCEEDED (r)) 
        {
          nsAutoString lang(str);

          if (lang.Equals(NS_LITERAL_STRING("409")) || lang.Find("409") != -1) obj.Append(NS_LITERAL_STRING("'en-US'"));
          else if (lang.Equals(NS_LITERAL_STRING("40a"))) obj.Append(NS_LITERAL_STRING("'es-ES'"));
          else if (lang.Equals(NS_LITERAL_STRING("40c"))) obj.Append(NS_LITERAL_STRING("'fr-FR'"));
          else if (lang.Equals(NS_LITERAL_STRING("407"))) obj.Append(NS_LITERAL_STRING("'de-DE'"));
          else if (lang.Equals(NS_LITERAL_STRING("411"))) obj.Append(NS_LITERAL_STRING("'jp-JP'"));
          else if (lang.Equals(NS_LITERAL_STRING("404"))) obj.Append(NS_LITERAL_STRING("'zh-TW'"));
          else if (lang.Equals(NS_LITERAL_STRING("804"))) obj.Append(NS_LITERAL_STRING("'zh-CN'"));
          else 
          {
            obj.Append(NS_LITERAL_STRING("'"));
            obj.Append(str);
            obj.Append(NS_LITERAL_STRING("'"));
          }

        }

        obj.Append(NS_LITERAL_STRING(", id: '"));
        obj.Append(pszCurTokenId);
        obj.Append(NS_LITERAL_STRING("'"));

        obj.Append(NS_LITERAL_STRING(" }"));
        // printf("OBJ: %s\n", NS_ConvertUTF16toUTF8(obj).get());

        out.Append(obj);

      }
        else out.Append(pszCurTokenId);


      if (ulCount != 0) out.Append(NS_LITERAL_STRING("|"));
    }

  }

  _retval.Assign(out);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetKey(nsAString & _retval)
{
 
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetSystemVolume(int32_t *aVolume)
{
  if (IsWindowsVistaOrGreater())
  {
    HRESULT hr;

    if (mEnumerator)
    {
      IMMDevice *pDevice;
      mEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);

      if (pDevice)
      {
        IAudioEndpointVolume *endpointVolume;
        hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_INPROC_SERVER, NULL, reinterpret_cast<void **>(&endpointVolume));

        float currentVolume;
        hr = endpointVolume->GetMasterVolumeLevelScalar(&currentVolume);

        *aVolume = (int)floor(currentVolume*10 + 0.5);
      }
    }
  }
    else
  {
    MMRESULT result;
    HMIXER hMixer;
    result = mixerOpen(&hMixer, MIXER_OBJECTF_MIXER, 0, 0, 0);

    MIXERLINE ml = {0};
    ml.cbStruct = sizeof(MIXERLINE);
    ml.dwComponentType = MIXERLINE_COMPONENTTYPE_DST_SPEAKERS;
    result = mixerGetLineInfo((HMIXEROBJ) hMixer, &ml, MIXER_GETLINEINFOF_COMPONENTTYPE);

    MIXERLINECONTROLS mlc = {0};
    MIXERCONTROL mc = {0};
    mlc.cbStruct = sizeof(MIXERLINECONTROLS);
    mlc.dwLineID = ml.dwLineID;
    mlc.dwControlType = MIXERCONTROL_CONTROLTYPE_VOLUME;
    mlc.cControls = 1;
    mlc.pamxctrl = &mc;
    mlc.cbmxctrl = sizeof(MIXERCONTROL);
    result = mixerGetLineControls((HMIXEROBJ) hMixer, &mlc, MIXER_GETLINECONTROLSF_ONEBYTYPE);

    MIXERCONTROLDETAILS mcd = {0};
    MIXERCONTROLDETAILS_UNSIGNED mcdu = {0};

    mcd.cbStruct = sizeof(MIXERCONTROLDETAILS);
    mcd.hwndOwner = 0;
    mcd.dwControlID = mc.dwControlID;
    mcd.paDetails = &mcdu;
    mcd.cbDetails = sizeof(MIXERCONTROLDETAILS_UNSIGNED);
    mcd.cChannels = 1;
    result = mixerGetControlDetails((HMIXEROBJ) hMixer, &mcd, MIXER_SETCONTROLDETAILSF_VALUE);

    float f = 10 * ((float)mcdu.dwValue/65535); // the volume is a number between 0 and 65535 so convert it to a whole number between 1 and 10

    *aVolume = (int)ceil(f);

    mixerClose(hMixer);
  }

  // printf("-------- ::GetSystemVolume (%d) --------\n", *aVolume);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetSystemVolume(int32_t aVolume)
{
  if (aVolume >= 10) aVolume = 10;
  if (aVolume <= 0) aVolume = 0;

  // printf("-------- ::SetSystemVolume (%d) --------\n", aVolume);
  if (IsWindowsVistaOrGreater())
  {
    HRESULT hr;

    if (mEnumerator)
    {
      IMMDevice *pDevice;
      mEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);

      if (pDevice)
      {
        IAudioEndpointVolume *endpointVolume;
        hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_INPROC_SERVER, NULL, reinterpret_cast<void **>(&endpointVolume));

        
        float newVolume = float(aVolume / 10.0f);

        if (endpointVolume) 
        {
          hr = endpointVolume->SetMute(FALSE, NULL);
          hr = endpointVolume->SetMasterVolumeLevelScalar(newVolume, NULL);

          endpointVolume->Release();
        }
      }
    }
  }
    else
  {
    MMRESULT result;
    HMIXER hMixer;
    result = mixerOpen(&hMixer, MIXER_OBJECTF_MIXER, 0, 0, 0);

    MIXERLINE ml = {0};
    ml.cbStruct = sizeof(MIXERLINE);
    ml.dwComponentType = MIXERLINE_COMPONENTTYPE_DST_SPEAKERS;
    result = mixerGetLineInfo((HMIXEROBJ) hMixer, &ml, MIXER_OBJECTF_HMIXER | MIXER_GETLINEINFOF_COMPONENTTYPE);

    MIXERLINECONTROLS mlc = {0};
    MIXERCONTROL mc = {0};
    mlc.cbStruct = sizeof(MIXERLINECONTROLS);
    mlc.dwLineID = ml.dwLineID;
    mlc.dwControlType = MIXERCONTROL_CONTROLTYPE_VOLUME;
    mlc.cControls = 1;
    mlc.pamxctrl = &mc;
    mlc.cbmxctrl = sizeof(MIXERCONTROL);
    result = mixerGetLineControls((HMIXEROBJ) hMixer, &mlc, MIXER_GETLINECONTROLSF_ONEBYTYPE);

    MIXERCONTROL mxc;
    MIXERLINECONTROLS mxlc;
    mxlc.cbStruct = sizeof(MIXERLINECONTROLS);
    mxlc.dwLineID = ml.dwLineID;
    mxlc.dwControlType = MIXERCONTROL_CONTROLTYPE_MUTE;
    mxlc.cControls = 1;
    mxlc.cbmxctrl = sizeof(MIXERCONTROL);
    mxlc.pamxctrl = &mxc;
    result = mixerGetLineControls((HMIXEROBJ) hMixer, &mxlc, MIXER_OBJECTF_HMIXER | MIXER_GETLINECONTROLSF_ONEBYTYPE);

    MIXERCONTROLDETAILS_BOOLEAN mxcdMute = { 0 };
    MIXERCONTROLDETAILS mxcd;
    mxcd.cbStruct = sizeof(MIXERCONTROLDETAILS);
    mxcd.dwControlID = mxc.dwControlID;
    mxcd.cChannels = 1;
    mxcd.cMultipleItems = 0;
    mxcd.cbDetails = sizeof(MIXERCONTROLDETAILS_BOOLEAN);
    mxcd.paDetails = &mxcdMute;
    mixerSetControlDetails(reinterpret_cast<HMIXEROBJ>(hMixer), &mxcd, MIXER_OBJECTF_HMIXER | MIXER_SETCONTROLDETAILSF_VALUE);

    MIXERCONTROLDETAILS mcd = {0};
    MIXERCONTROLDETAILS_UNSIGNED mcdu = {0};
    mcdu.dwValue = (65535 * aVolume)/10; // the volume is a number between 0 and 65535

    mcd.cbStruct = sizeof(MIXERCONTROLDETAILS);
    mcd.hwndOwner = 0;
    mcd.dwControlID = mc.dwControlID;
    mcd.paDetails = &mcdu;
    mcd.cbDetails = sizeof(MIXERCONTROLDETAILS_UNSIGNED);
    mcd.cChannels = 1;

    // set master volume
    result = mixerSetControlDetails((HMIXEROBJ) hMixer, &mcd, MIXER_SETCONTROLDETAILSF_VALUE);
    mixerClose(hMixer);
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetSystemMute(bool *aSystemMute)
{
  if (IsWindowsVistaOrGreater())
  {
    HRESULT hr;

    if (mEnumerator)
    {
      IMMDevice *pDevice;
      mEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);

      if (pDevice)
      {
        IAudioEndpointVolume *endpointVolume;
        hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_INPROC_SERVER, NULL, reinterpret_cast<void **>(&endpointVolume));

        if (endpointVolume) 
        {
          hr = endpointVolume->GetMute((BOOL*)aSystemMute);

          endpointVolume->Release();
        }
      }
    }
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetSystemMute(bool aSystemMute)
{
  if (IsWindowsVistaOrGreater())
  {
    HRESULT hr;

    if (mEnumerator)
    {
      IMMDevice *pDevice;
      mEnumerator->GetDefaultAudioEndpoint(eRender, eMultimedia, &pDevice);

      if (pDevice)
      {
        IAudioEndpointVolume *endpointVolume;
        hr = pDevice->Activate(__uuidof(IAudioEndpointVolume), CLSCTX_INPROC_SERVER, NULL, reinterpret_cast<void **>(&endpointVolume));

        if (endpointVolume) 
        {
          hr = endpointVolume->SetMute(aSystemMute, NULL);

          endpointVolume->Release();
        }
      }
    }
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetPermissive(bool *aPermissive)
{

  *aPermissive = mPermissive;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetPermissive(bool aPermissive)
{
  HWND hwnd = FindWindow("Shell_traywnd", NULL);

  // ShowWindow(FindWindow("Shell_TrayWnd", NULL), SW_HIDE);
  // ShowWindow(FindWindowEx(hwnd, 0, "Button", NULL), SW_HIDE);

  if (!aPermissive)
  {
    // printf("******** LOCK ********\n");

    ShowWindow(hwnd, SW_HIDE); // hide it
    EnableWindow(hwnd, FALSE); // disable it
    EnableWindow(FindWindowEx(hwnd, 0, "Button", NULL), FALSE); // disable it

    if (IsWindowsVistaOrGreater())
    {
      HWND startOrb = FindWindowEx(NULL, NULL, MAKEINTATOM(0xC017), NULL);
      ShowWindow(startOrb, SW_HIDE); // Hide Vista Start Orb
    }
  }
    else
  {
    // printf("******** UNLOCK ********\n");

    ShowWindow(hwnd, SW_SHOW); // show it
    EnableWindow(hwnd, TRUE);  // enable it
    EnableWindow(FindWindowEx(hwnd, 0, "Button", NULL), TRUE); // enable it
    ShowWindow(FindWindowEx(hwnd, 0, "Button", NULL), SW_SHOW);

    if (IsWindowsVistaOrGreater())
    {
      HWND startOrb = FindWindowEx(NULL, NULL, MAKEINTATOM(0xC017), NULL);
      ShowWindow(startOrb, SW_SHOW); // Show Vista Start Orb
    }
  }

  mPermissive = aPermissive;
  mPrefs->SetBoolPref("securebrowser.mode.permissive", mPermissive);

  nsCOMPtr<nsIObserverService> os;
  os = do_GetService("@mozilla.org/observer-service;1");

  nsAutoString msg;
  if (aPermissive) msg.Assign(NS_LITERAL_STRING("ON"));
  else msg.Assign(NS_LITERAL_STRING("OFF"));

  if (os) os->NotifyObservers(nullptr, "sb-permissive-mode", msg.get());

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetSoxVersion(nsAString & aSoxVersion)
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::LockScreen(bool aIsAdmin)
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetClearTypeEnabled(bool *aClearTypeEnabled)
{
  UINT type;
  BOOL bSuccess = SystemParametersInfo(SPI_GETFONTSMOOTHINGTYPE, 0, &type, 0);

  *aClearTypeEnabled = (type == FE_FONTSMOOTHINGCLEARTYPE);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::KillProcess(const nsAString & aProcessName)
{
  // printf("::KillProcess [%s]\n", NS_ConvertUTF16toUTF8(aProcessName).get()); 

  // if (!IsWin8OrGreater()) return NS_OK;

  nsresult rv;

  HANDLE hProcess, hSnapshot;
  PROCESSENTRY32 ProcessEntry;
  BOOL moreproc = FALSE;

  hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPALL, 0);

  if (hSnapshot == (HANDLE)-1) return NS_ERROR_FAILURE;

  ProcessEntry.dwSize = sizeof(ProcessEntry);  
  moreproc = Process32First(hSnapshot, &ProcessEntry); 

  while (moreproc)     
  {
    hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, ProcessEntry.th32ProcessID);

    if (hProcess == NULL)
    {
      moreproc = Process32Next(hSnapshot, &ProcessEntry);
      continue;
    }
  
    nsAutoString pname;
    pname.AssignLiteral(ProcessEntry.szExeFile);

    // printf("RunningProcess [%s]\n", NS_ConvertUTF16toUTF8(pname).get()); 


    if (pname.Equals(aProcessName))
    {
      if (TerminateProcess(hProcess, 1))
      {
        // printf("Process [%s] was terminated\n", NS_ConvertUTF16toUTF8(pname).get()); 
        rv = NS_OK;
        break;
      }
        else
      {
        // printf("Process [%s] was NOT terminated\n", NS_ConvertUTF16toUTF8(pname).get()); 
        rv = NS_ERROR_FAILURE;
      }
    } 
      else
    {
      // printf("Process [%s] was NOT found\n", NS_ConvertUTF16toUTF8(pname).get()); 
      rv = NS_ERROR_DOM_NOT_FOUND_ERR;

    }
  
    CloseHandle(hProcess);
    moreproc = Process32Next(hSnapshot, &ProcessEntry);
  }  

  return rv;
}

NS_IMETHODIMP
mozSecureBrowser::StartProcess(const nsAString & aPath)
{
  PrintLogMsg2("Start Process"); 

  nsresult rv = NS_OK;


  STARTUPINFOW si;
  PROCESS_INFORMATION pi;

  ZeroMemory(&si, sizeof(si));
  si.cb = sizeof(si);
  ZeroMemory(&pi, sizeof(pi));

  nsAutoString path(aPath);
    
  if (!CreateProcessW(path.get(), nullptr, nullptr, nullptr, FALSE, DETACHED_PROCESS, nullptr, nullptr, &si, &pi))
  {
    PrintLogMsg2("Could not execute program");
    rv = NS_ERROR_FAILURE;
  }

  return rv;
}

void
mozSecureBrowser::PrintPointer(const char* aName, nsISupports* aPointer)
{
  printf ("%s (%p)\n", aName, (void*)aPointer);
}

BOOL
mozSecureBrowser::GetLogonSID (HANDLE hToken, PSID *ppsid) 
{
  BOOL bSuccess = FALSE;
  DWORD dwIndex;
  DWORD dwLength = 0;
  PTOKEN_GROUPS ptg = NULL;

  // Verify the parameter passed in is not NULL.
  if (NULL == ppsid)
    goto Cleanup;

  // Get required buffer size and allocate the TOKEN_GROUPS buffer.

  if (!GetTokenInformation(
    hToken,         // handle to the access token
    TokenGroups,    // get information about the token's groups 
    (LPVOID) ptg,   // pointer to TOKEN_GROUPS buffer
    0,              // size of buffer
    &dwLength       // receives required buffer size
    )) 
  {
    if (GetLastError() != ERROR_INSUFFICIENT_BUFFER) 
      goto Cleanup;

    ptg = (PTOKEN_GROUPS)HeapAlloc(GetProcessHeap(),
      HEAP_ZERO_MEMORY, dwLength);

    if (ptg == NULL) goto Cleanup;
  }

  // Get the token group information from the access token.

  if (!GetTokenInformation(
        hToken,         // handle to the access token
        TokenGroups,    // get information about the token's groups 
        (LPVOID) ptg,   // pointer to TOKEN_GROUPS buffer
        dwLength,       // size of buffer
        &dwLength       // receives required buffer size
        )) 
  {
    goto Cleanup;
  }

  // Loop through the groups to find the logon SID.

  for (dwIndex = 0; dwIndex < ptg->GroupCount; dwIndex++) 
  {
    if ((ptg->Groups[dwIndex].Attributes & SE_GROUP_LOGON_ID) ==  SE_GROUP_LOGON_ID) 
    {
      // Found the logon SID; make a copy of it.

         dwLength = GetLengthSid(ptg->Groups[dwIndex].Sid);
         *ppsid = (PSID) HeapAlloc(GetProcessHeap(),
                     HEAP_ZERO_MEMORY, dwLength);
         if (*ppsid == NULL)
             goto Cleanup;
         if (!CopySid(dwLength, *ppsid, ptg->Groups[dwIndex].Sid)) 
         {
             HeapFree(GetProcessHeap(), 0, (LPVOID)*ppsid);
             goto Cleanup;
         }
     bSuccess = TRUE;
         break;
    }
  }

  Cleanup: 

  // Free the buffer for the token groups.

  if (ptg != NULL) HeapFree(GetProcessHeap(), 0, (LPVOID)ptg);

  return bSuccess;
}

void
mozSecureBrowser::GetOSEdition()
{
  OSVERSIONINFOEX osvi;
  SYSTEM_INFO si;
  PGNSI pGNSI;
  PGPI pGPI;
  BOOL bOsVersionInfoEx;
  DWORD dwType;

  ZeroMemory(&si, sizeof(SYSTEM_INFO));
  ZeroMemory(&osvi, sizeof(OSVERSIONINFOEX));

  osvi.dwOSVersionInfoSize = sizeof(OSVERSIONINFOEX);
  bOsVersionInfoEx = GetVersionEx((OSVERSIONINFO*) &osvi);

  pGPI = (PGPI) GetProcAddress(GetModuleHandle(TEXT("kernel32.dll")), "GetProductInfo");

  pGPI(osvi.dwMajorVersion, osvi.dwMinorVersion, 0, 0, &dwType);

  switch (dwType)
  {
     case PRODUCT_ULTIMATE:
        mOSEdition.Assign(NS_LITERAL_STRING("Ultimate Edition "));
        break;
     case PRODUCT_PROFESSIONAL:
        mOSEdition.Assign(NS_LITERAL_STRING("Professional "));
        break;
     case PRODUCT_HOME_PREMIUM:
        mOSEdition.Assign(NS_LITERAL_STRING("Home Premium Edition "));
        break;
     case PRODUCT_HOME_BASIC:
        mOSEdition.Assign(NS_LITERAL_STRING("Home Basic Edition "));
        break;
     case PRODUCT_ENTERPRISE:
        mOSEdition.Assign(NS_LITERAL_STRING("Enterprise Edition "));
        break;
     case PRODUCT_BUSINESS:
        mOSEdition.Assign(NS_LITERAL_STRING("Business Edition "));
        break;
     case PRODUCT_STARTER:
        mOSEdition.Assign(NS_LITERAL_STRING("Starter Edition "));
        break;
     case PRODUCT_CLUSTER_SERVER:
        mOSEdition.Assign(NS_LITERAL_STRING("Cluster Server Edition "));
        break;
     case PRODUCT_DATACENTER_SERVER:
        mOSEdition.Assign(NS_LITERAL_STRING("Datacenter Edition "));
        break;
     case PRODUCT_DATACENTER_SERVER_CORE:
        mOSEdition.Assign(NS_LITERAL_STRING("Datacenter Edition (core installation) "));
        break;
     case PRODUCT_ENTERPRISE_SERVER:
        mOSEdition.Assign(NS_LITERAL_STRING("Enterprise Edition "));
        break;
     case PRODUCT_ENTERPRISE_SERVER_CORE:
        mOSEdition.Assign(NS_LITERAL_STRING("Enterprise Edition (core installation) "));
        break;
     case PRODUCT_ENTERPRISE_SERVER_IA64:
        mOSEdition.Assign(NS_LITERAL_STRING("Enterprise Edition for Itanium-based Systems "));
        break;
     case PRODUCT_SMALLBUSINESS_SERVER:
        mOSEdition.Assign(NS_LITERAL_STRING("Small Business Server "));
        break;
     case PRODUCT_SMALLBUSINESS_SERVER_PREMIUM:
        mOSEdition.Assign(NS_LITERAL_STRING("Small Business Server Premium Edition "));
        break;
     case PRODUCT_STANDARD_SERVER:
        mOSEdition.Assign(NS_LITERAL_STRING("Standard Server "));
        break;
     case PRODUCT_STANDARD_SERVER_CORE:
        mOSEdition.Assign(NS_LITERAL_STRING("Standard Server (core installation) "));
        break;
     case PRODUCT_WEB_SERVER:
        mOSEdition.Assign(NS_LITERAL_STRING("Web Server Edition "));
        break;
     default:
        mOSEdition.Assign(dwType);
  }

  // GetSystemInfo(&si);
  GetNativeSystemInfo(&si);

  if (si.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_AMD64 ||
      si.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_IA64  ||
      si.wProcessorArchitecture == PROCESSOR_ARCHITECTURE_ALPHA64) 
    mOSEdition.Append(NS_LITERAL_STRING("64 bit "));
  else 
    mOSEdition.Append(NS_LITERAL_STRING("32 bit "));

  /********
  mOSEdition.Append(NS_LITERAL_STRING("OEM ID: "));
  mOSEdition.AppendInt(si.dwOemId);
  mOSEdition.Append(NS_LITERAL_STRING(" Number of processors: "));
  mOSEdition.AppendInt(si.dwNumberOfProcessors);
  mOSEdition.Append(NS_LITERAL_STRING(" Processor architecture: "));
  mOSEdition.AppendInt(si.wProcessorArchitecture);

  mOSEdition.Append(NS_LITERAL_STRING("Build: "));
  mOSEdition.AppendInt(osvi.dwBuildNumber);
  ********/

}

NS_IMETHODIMP
mozSecureBrowser::GetOSversion(nsAString & aVersion)
{
  // OS
  aVersion = NS_LITERAL_STRING("Windows");
  
  aVersion.AppendLiteral("|");

  GetOSEdition();

  // NAME
  if (!mOSEdition.IsEmpty()) aVersion.Append(mOSEdition);
  else aVersion.AppendLiteral("null");

  aVersion.AppendLiteral("|");

  // VERSION
  if (IsWindowsVistaOrGreater() && !IsWindowsVistaSP1OrGreater()) aVersion.AppendLiteral("Vista");

  if (IsWindowsVistaSP1OrGreater() && !IsWindowsVistaSP2OrGreater()) aVersion.AppendLiteral("Vista (SP1)");

  if (IsWindowsVistaSP2OrGreater() && !IsWindows7OrGreater()) aVersion.AppendLiteral("Vista (SP2)");

  if (IsWindows7OrGreater() && !IsWindows7SP1OrGreater()) aVersion.AppendLiteral("7");

  if (IsWindows7SP1OrGreater() && !IsWindows8OrGreater()) aVersion.AppendLiteral("7 (SP1)");

  if (IsWindows8OrGreater() && !IsWindows8Point1OrGreater()) aVersion.AppendLiteral("8");

  if (IsWindows8Point1OrGreater() && !IsWindowsVersionOrGreater(10,0,0)) aVersion.AppendLiteral("8.1");

  if (IsWindowsVersionOrGreater(10,0,0)) aVersion.AppendLiteral("10");

  // if (IsWindowsServer()) aVersion.Append(NS_LITERAL_STRING("Server"));

  // BRAND
  aVersion.AppendLiteral("|");
  aVersion.AppendLiteral(SECURE_BROWSER_APPNAME);

  // printf("%s\n", NS_ConvertUTF16toUTF8(aVersion).get());

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetEnvVariable(const nsAString & name, nsAString & _retval)
{
  const char *v = getenv(NS_ConvertUTF16toUTF8(name).get());

  // printf ("mozSecureBrowser::GetEnvVariable [%s]\n", v);

  if (!v) v = "";

  _retval.AssignLiteral(v);

  return NS_OK;
}



