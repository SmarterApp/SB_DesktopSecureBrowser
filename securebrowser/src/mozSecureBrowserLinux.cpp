// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************
// SB header file
#include "mozSecureBrowserLinux.h"

#include <stdio.h>

#include "nsILocalFile.h"
#include "nsThreadUtils.h"
#include "nsIProperties.h"
#include "nsComponentManagerUtils.h"

#include <sys/utsname.h>

#define MAX_PATH 256

// class SBRunnable : public Runnable
class SBRunnable final : public mozilla::Runnable
{
  public:
    SBRunnable(const nsAString & aMsg, const nsAString & aPath, mozSecureBrowser* aSB) :
      mMsg(aMsg),
      mPath(aPath),
      mSB(aSB)
    {
      MOZ_ASSERT(!NS_IsMainThread()); // This should be running on the worker thread

      // printf("-------- RUN ON WORKER THREAD --------\n");

    }

    NS_IMETHOD Run()
    {
      MOZ_ASSERT(NS_IsMainThread()); // This method is supposed to run on the main thread!

      // printf("-------- RUN ON MAIN THREAD --------\n");

      // Convert to a waveform

      nsAutoString shellPath(NS_LITERAL_STRING(".SynthesizeToSpeech.sh"));  

      // shellPath will change from leafName to full Linux path if it exists
      if (mSB->ShellScriptExists(shellPath)) 
      {
        shellPath.Append(NS_LITERAL_STRING(" \""));
        shellPath.Append(mMsg);
        shellPath.Append(NS_LITERAL_STRING("\""));
        shellPath.Append(NS_LITERAL_STRING(" "));
        shellPath.Append(mPath);

        nsAutoString voiceName;
        mSB->GetVoiceName(voiceName);

        shellPath.Append(NS_LITERAL_STRING(" "));
        shellPath.Append(voiceName);

        // printf("-------- cmd [%s] --------\n", NS_ConvertUTF16toUTF8(shellPath).get());
        int retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
        // printf("-------- retval --------\n");

        if (retval != 0) 
        {
          printf("-------- SynthesizeToSpeech SHELL SCRIPT ERROR --------\n");
          // return NS_ERROR_FAILURE;
        }
      }

      mSB->PlayInternal(mPath);

      return NS_OK;
    }

  private:
    nsAutoString mMsg, mPath;
    RefPtr<mozSecureBrowser> mSB;
};

mozSecureBrowser::mozSecureBrowser()
  : mVol(10),
    mLastMuteVol(0),
    mPitchInt(0),
    mSystemMute(false),
    mSystemCall(false),
    mIs64BitOS(false),
    mUseStoredVoiceName(false),
    mRate(NS_LITERAL_STRING("")),
    mPitch(NS_LITERAL_STRING(""))
{
  printf("-------- mozSecureBrowser::CREATE --------\n");

  mPrefs = do_GetService(NS_PREFSERVICE_CONTRACTID);

  int32_t rate, pitch;
  mPrefs->GetIntPref("securebrowser.tts.pitch", &pitch);
  mPrefs->GetIntPref("securebrowser.tts.rate", &rate);

  mRate.AppendInt(rate);
  mPitch.AppendInt(pitch);

  mStatus.Assign(NS_LITERAL_STRING("Stopped"));

  strcpy(mRateChar, "1");

  int rv = system("which play > /dev/null 2>&1");

  struct utsname name;

  int ret = uname(&name);

  if (ret >= 0) 
  {
    nsAutoCString buf;
    buf =  (char*)name.machine;
    // printf("-------- uname (%s) --------\n", buf.get());

    if (buf.Equals("x86_64")) mIs64BitOS = true;
  }

  // printf("-------- 64 BIT OS [%s] --------\n", mIs64BitOS ? "TRUE" : "FALSE");

  if (rv != 256)
  {
    FILE *fp = NULL;
    char path[MAX_PATH];

    fp = popen("play --version", "r");

    if (fp == NULL) printf("FAILED TO FIND SOX PLAY\n");

    nsAutoString out;

    if (fp)
    {
      while(!feof(fp))
      {
        if (fgets(path, sizeof(path), fp) != NULL)
        {
          // printf("%s", path);

          out.Assign(NS_ConvertUTF8toUTF16(path).get());

          out.StripChars("\r\n");

          break;
        }

        int status = pclose(fp);

        if (status == -1) printf("mozSecureBrowser::mozSecureBrowser:FAILED TO CLOSE FILE STREAM \n"); 
      }
    }

    mSoxVersion.Assign(out);

    mSoxKludge = mSoxVersion.EqualsLiteral("play (sox) 3.0");
  }
    else
  {
    mSoxVersion.AssignLiteral("FAILED TO FIND SOX PLAY");
  }

  int retval = system("amixer get Master | grep off > /dev/null 2>&1");

  if (retval == 0) mSystemMute = PR_TRUE;

  // printf("-------- SYSTEM MUTE (%d) --------\n", mSystemMute);
}

mozSecureBrowser::~mozSecureBrowser() 
{
  printf("-------- mozSecureBrowser::DESTROY --------\n");

  Stop();

  if (mWavFile) mWavFile->Remove(PR_FALSE);
}

void
mozSecureBrowser::GetShellScript(nsAString & aName, FILE **aFp)
{
  nsAutoString paramList(NS_LITERAL_STRING(" "));

  return GetShellScript(aName, paramList, aFp);
}

void
mozSecureBrowser::GetShellScript(nsAString & aName, nsAString & paramList, FILE **aFp)
{
  nsAutoString shellPath(aName);

  if (ShellScriptExists(shellPath))
  {
    // append the arguments when invoking the shell script
    shellPath.Append(NS_LITERAL_STRING(" "));
    shellPath.Append(paramList);

    printf("-------- Executing Override [%s] --------\n", NS_ConvertUTF16toUTF8(shellPath).get());

    *aFp = popen(NS_ConvertUTF16toUTF8(shellPath).get(), "r");

    return;
  }

  *aFp = NULL;

  return;
}

nsresult
mozSecureBrowser::GetShellScriptOutputAsAString(nsAString & aName, nsAString &_retval)
{
  nsresult rv = NS_OK;

  nsAutoString out;

  FILE *fp = NULL;
  char str[MAX_PATH];

  // printf("-------- GetShellScriptOutputAsAString:aName [%s] --------\n", NS_ConvertUTF16toUTF8(aName).get());

  fp = popen(NS_ConvertUTF16toUTF8(aName).get(), "r");

  if (!fp) return NS_ERROR_FAILURE;
  
  while(!feof(fp))
  {
    if (fgets(str, sizeof(str), fp) != NULL)
    {
      if (out.Length()) out.Append(NS_LITERAL_STRING("|"));

      // printf("str: %s", str);

      out.Append(NS_ConvertUTF8toUTF16(str).get());

      out.StripWhitespace();
    }
  }

  int status = pclose(fp);

  if (status == -1) printf("mozSecureBrowser::GetShellScriptOutputAsAString:FAILED TO CLOSE FILE STREAM \n"); 
 
  _retval.Assign(out);

  // printf("-------- GetShellScriptOutputAsAString OUT [%s] --------\n", NS_ConvertUTF16toUTF8(out).get());

  return rv;
}

nsresult
mozSecureBrowser::GetShellScriptOutputAsJSObject(nsAString & aName, nsAString &_retval)
{
  nsresult rv = NS_OK;

  nsAutoString out;

  FILE *fp = NULL;
  char str[MAX_PATH];

  // printf("-------- GetShellScriptOutputAsJSObject:aName [%s] --------\n", NS_ConvertUTF16toUTF8(aName).get());

  fp = popen(NS_ConvertUTF16toUTF8(aName).get(), "r");

  if (!fp) return NS_ERROR_FAILURE;
  
  while(!feof(fp))
  {
    if (fgets(str, sizeof(str), fp) != NULL)
    {
      if (out.Length()) out.Append(NS_LITERAL_STRING("|"));

      nsAutoCString s (str);

      s.StripWhitespace();

      out.Append(NS_LITERAL_STRING("{ name: '"));
      out.AppendLiteral(s.get()); 
      out.Append(NS_LITERAL_STRING("', gender: "));
      out.AppendLiteral("'female'"); 
      out.Append(NS_LITERAL_STRING(", lang: '"));
      out.AppendLiteral(s.get()); 
      out.Append(NS_LITERAL_STRING("', id: '"));
      out.AppendLiteral(s.get()); 
      out.Append(NS_LITERAL_STRING("' }"));
    }
  }

  int status = pclose(fp);

  if (status == -1) printf("mozSecureBrowser::GetShellScriptOutputAsAString:FAILED TO CLOSE FILE STREAM \n"); 
 
  _retval.Assign(out);

  // printf("-------- GetShellScriptOutputAsJSObject OUT [%s] --------\n", NS_ConvertUTF16toUTF8(out).get());

  return rv;
}

bool
mozSecureBrowser::ShellScriptExists(nsAString & aName)
{
  nsresult rv;

  nsCOMPtr<nsIProperties> dirService(do_GetService("@mozilla.org/file/directory_service;1", &rv));
  if (NS_FAILED(rv)) return PR_FALSE;

  nsCOMPtr<nsIFile> shellScriptBin;
  rv = dirService->Get("CurProcD", NS_GET_IID(nsIFile), getter_AddRefs(shellScriptBin));
  if (NS_FAILED(rv)) return PR_FALSE;

  shellScriptBin->Append(NS_LITERAL_STRING("sb_securebrowser_bin"));
  shellScriptBin->Append(aName);

  bool exists;
  shellScriptBin->Exists(&exists);

  nsAutoString shellPath;
  shellScriptBin->GetPath(shellPath);

  // printf("-------- EXISTS [%s] --------\n", NS_ConvertUTF16toUTF8(shellPath).get());

  if (exists) 
  {
    aName.Assign(shellPath);
  }

  // printf("-------- EXISTS [%s] --------\n", exists ? "TRUE" : "FALSE");

  return exists;
}

int
mozSecureBrowser::GetCards()
{
  FILE *fp = NULL;
  char str[MAX_PATH];

  nsAutoString s;
  s.AssignLiteral("arecord --list-devices 2> /dev/null | grep card | wc -l ");

  // printf("******** Number of Cards cmd [%s] ********\n", NS_ConvertUTF16toUTF8(s).get());

  fp = popen(NS_ConvertUTF16toUTF8(s).get(), "r");

  if (!fp) return -1;
  
  nsAutoString out;
  while(!feof(fp))
  {
    if (fgets(str, sizeof(str), fp) != NULL)
    {
      out.Append(NS_ConvertUTF8toUTF16(str).get());
      out.StripWhitespace();
      int status = pclose(fp);
      if (status == -1) printf("mozSecureBrowser::GetCards:FAILED TO CLOSE FILE STREAM\n"); 
      break;
    }
  }

  // printf("******** Attempt Number of Cards [%s] ********\n", NS_ConvertUTF16toUTF8(out).get());

  nsresult error;
  int len = out.ToInteger(&error);

  // printf("******** Number of Cards [%d] ********\n", len);

  return len;
}

NS_IMPL_ISUPPORTS(mozSecureBrowser, mozISecureBrowser)

NS_IMETHODIMP
mozSecureBrowser::GetVersion(nsAString & aVersion)
{
  aVersion = NS_LITERAL_STRING(MOZ_APP_UA_VERSION);

  return NS_OK;
}

nsresult
mozSecureBrowser::Init()
{
  // printf("-------- ::Init() --------\n");
  Initialize();
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetAllProcesses(nsAString & _retval)
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetRunningProcessList(nsAString & _retval) 
{
  // printf("mozSecureBrowser::GetRunningProcessList\n"); 

  FILE *fp = NULL;
  char path[MAX_PATH];

  nsAutoString name(NS_LITERAL_STRING(".GetRunningProcessList.sh"));  

  GetShellScript(name, &fp);

  if (!fp)
  {
    fp = popen("ps -u `whoami` -o cmd | sed -e's: .*$::g' | sed -e's:^.*\\/::g' | sed -e's:\\[::g' | sed -e's:\\]::g' | sed /CMD/d | sort -u ", "r");
  }

  if (fp == NULL) return NS_ERROR_FAILURE;

  nsAutoString out;

  while(!feof(fp))
  {
    if (fgets(path, sizeof(path), fp) != NULL)
    {
      if (out.Length()) out.Append(NS_LITERAL_STRING(","));

      // printf("%s", path);

      out.Append(NS_ConvertUTF8toUTF16(path).get());

      out.StripWhitespace();
    }
  }

  _retval = out;

  // printf("[%s]\n", NS_ConvertUTF16toUTF8(out).get());

  // printf("******** fp(%p) ********\n", (void*)fp);

  int status = pclose(fp);

  if (status == -1) printf("mozSecureBrowser::GetRunningProcessList:FAILED TO CLOSE FILE STREAM\n"); 

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetServices(nsAString & _retval)
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetMACAddress(nsAString & _retval)
{
  // printf("mozSecureBrowser::GetMACAddress\n"); 

  // ifconfig -a | grep  HWaddr | sed -e's:^.*HWaddr\s::g'

  FILE *fp = NULL;
  char path[PATH_MAX];

  nsAutoString name(NS_LITERAL_STRING(".GetMACAddress.sh"));

  GetShellScript(name, &fp);

  if (!fp) 
  {
    // ensure we use a full path to get the interface MAC address using the bundled 'interface.sh' script
    nsresult rv;
    nsCOMPtr<nsIProperties> dirService(do_GetService("@mozilla.org/file/directory_service;1", &rv));
    if (NS_FAILED(rv)) return NS_ERROR_FAILURE;

    nsCOMPtr<nsIFile> shellScriptBin;
    rv = dirService->Get("CurProcD", NS_GET_IID(nsIFile), getter_AddRefs(shellScriptBin));
    if (NS_FAILED(rv)) return NS_ERROR_FAILURE;

    nsCOMPtr<nsIFile> shellScriptBinParent;
    rv = shellScriptBin->GetParent(getter_AddRefs(shellScriptBinParent));
    if (NS_FAILED(rv)) return NS_ERROR_FAILURE;
    
    shellScriptBinParent->Append(NS_LITERAL_STRING("interface.sh"));

    nsAutoString ifPath;
    shellScriptBinParent->GetPath(ifPath);
    // printf("-------- interface.sh FULL PATH (%s) --------\n", NS_ConvertUTF16toUTF8(ifPath).get());

    fp = popen(NS_ConvertUTF16toUTF8(ifPath).get(), "r");
  }

  if (fp == NULL) return NS_ERROR_FAILURE;

  nsAutoString out;

  while(!feof(fp))
  {
    if (fgets(path, sizeof(path), fp) != NULL)
    {
      if (out.Length()) out.Append(NS_LITERAL_STRING(","));

      // printf("%s", path);

      out.Append(NS_ConvertUTF8toUTF16(path).get());

      out.StripWhitespace();
    }
  }

  _retval = out;

  int status = pclose(fp);

  if (status == -1) printf("mozSecureBrowser::GetMACAddress:FAILED TO CLOSE FILE STREAM \n"); 
 
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Initialize()
{
  // Check if an override is available that needs to be invoked 
  nsAutoString shellPath(NS_LITERAL_STRING(".Initialize.sh"));

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) 
  {
    int retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
    if (retval == 0) printf("-------- call to shell script [%s] FAILED --------\n", NS_ConvertUTF16toUTF8(shellPath).get());
  } 

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Uninitialize()
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::InitializeListener(const nsAString & aType)
{
  //printf("mozSecureBrowser::Initialize Listener\n"); 
  
  return NS_OK;
}

nsresult
mozSecureBrowser::SynthesizeToSpeech(const nsAString &aText, const nsAString &aPath)
{
  // printf("mozSecureBrowser::SynthesizeToSpeech\n"); 

  nsCOMPtr<nsIRunnable> resultrunnable = new SBRunnable(aText, aPath, this);
  NS_DispatchToMainThread(resultrunnable);

  mStatus.Assign(NS_LITERAL_STRING("Buffering"));

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Play(const nsAString & text)
{
  // printf("-------- Play --------\n");

  if (text.IsEmpty()) return NS_OK;

  Stop();

  mStatus.Assign(NS_LITERAL_STRING("Buffering"));

  nsAutoString str1(text);

  int index;
  while ((index = str1.Find("'")) != -1)
    str1.Replace(index, 1, NS_LITERAL_STRING(""));

  while ((index = str1.Find("\n")) != -1)
    str1.Replace(index, 1, NS_LITERAL_STRING(" "));

  while ((index = str1.Find("\"")) != -1)
    str1.Replace(index, 1, NS_LITERAL_STRING(""));

  // printf("%s\n", NS_ConvertUTF16toUTF8(str1).get());

  nsAutoString s;

  s.Append(NS_LITERAL_STRING("play -v "));

  if (mVol != 10) 
  {
    s.Append(NS_LITERAL_STRING("."));
    s.AppendInt(mVol);
  }
    else
  {
    s.Append(NS_LITERAL_STRING("1"));
  }

  nsresult rv;

  nsCOMPtr<nsIProperties> dirService(do_GetService("@mozilla.org/file/directory_service;1", &rv));

  if (NS_FAILED(rv)) return rv;

  nsAutoString path;

  if (!mWavFile)
  {
    rv = dirService->Get("ProfD", NS_GET_IID(nsIFile), getter_AddRefs(mWavFile));
    if (NS_FAILED(rv)) return rv;

    rv = mWavFile->Append(NS_LITERAL_STRING(".d273c04c-9745-4bf8-845e-38797d6fa99f.wav")); 
    if (NS_FAILED(rv)) return rv;
  }

  // always remove before we create a new one
  mWavFile->Remove(PR_FALSE);

  rv = mWavFile->GetPath(path);
  if (NS_FAILED(rv)) return rv;

  s.Append(NS_LITERAL_STRING(" "));
  s.Append(path);
  s.Append(NS_LITERAL_STRING(" tempo "));
  s.Append(NS_ConvertUTF8toUTF16(mRateChar));

  if (!mSoxKludge)
  {
    s.Append(NS_LITERAL_STRING(" pitch "));
    s.AppendInt(mPitchInt);
  }

  s.Append(NS_LITERAL_STRING(" > /dev/null 2>&1 "));
  s.Append(NS_LITERAL_STRING(" &"));
  
  // printf("-------- (%s) --------\n", NS_ConvertUTF16toUTF8(s).get());

  mPlayCmd.Assign(s);

  rv = SynthesizeToSpeech(str1, path);

  if (NS_FAILED(rv)) return rv;

  return NS_OK;
}

nsresult
mozSecureBrowser::PlayInternal(const nsAString & aPath)
{
  if (mSystemCall) return PlayInternal(aPath);

  mStatus.Assign(NS_LITERAL_STRING("Playing"));

  // printf("-------- PlayInternal --------\n");

  int retval;

  nsAutoString shellPath(NS_LITERAL_STRING(".Play.sh"));  

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) 
  {
    // Append parameters to the call
    shellPath.Append(NS_LITERAL_STRING(" file "));
    shellPath.Append(aPath);

    shellPath.Append(NS_LITERAL_STRING(" volume "));
    shellPath.AppendInt(mVol);

    shellPath.Append(NS_LITERAL_STRING(" pitch "));
    shellPath.AppendInt(mPitchInt);
    
    shellPath.Append(NS_LITERAL_STRING(" tempo "));
    shellPath.Append(NS_ConvertUTF8toUTF16(mRateChar));

    // printf("-------- [%s] --------\n", NS_ConvertUTF16toUTF8(shellPath).get());

    retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
  }
    else 
  {
    // printf("-------- [%s] --------\n", NS_ConvertUTF16toUTF8(mPlayCmd).get());
    retval = system(NS_ConvertUTF16toUTF8(mPlayCmd).get());
  }

  if (retval != 0) 
  {
    printf("-------- PLAY ERROR --------\n");
    return NS_ERROR_FAILURE;
  }

  // printf("-------- PlayInternal RETURNING --------\n");

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Stop()
{
  // printf("mozSecureBrowser::Stop\n"); 

  int retval;

  nsAutoString shellPath(NS_LITERAL_STRING(".Stop.sh"));

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
  else if (mSoxKludge) retval = system("killall -KILL sox > /dev/null 2>&1");
  else retval = system("killall -KILL play > /dev/null 2>&1");

  if (retval != 0) 
  {
    // printf("-------- STOP ERROR --------\n");
  }
  
  mStatus.Assign(NS_LITERAL_STRING("Stopped"));

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Pause()
{
  // printf("mozSecureBrowser::Pause\n"); 

  int retval;

  nsAutoString shellPath(NS_LITERAL_STRING(".Pause.sh"));

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
  else if (mSoxKludge) retval = system("killall -STOP sox");
  else retval = system("killall -STOP play");

  if (retval != 0) 
  {
    //printf("-------- PAUSE ERROR (%d) --------\n", retval);
    return NS_ERROR_FAILURE;
  }
  
  mStatus.Assign(NS_LITERAL_STRING("Paused"));

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Resume()
{
  // printf("mozSecureBrowser::Resume\n"); 

  int retval;

  nsAutoString shellPath(NS_LITERAL_STRING(".Resume.sh"));

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
  else if (mSoxKludge) retval = system("killall -CONT sox");
  else retval = system("killall -CONT play");

  if (retval != 0) 
  {
    //printf("-------- RESUME ERROR --------\n");
    return NS_ERROR_FAILURE;
  }
  
  mStatus.Assign(NS_LITERAL_STRING("Playing"));

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetVoiceName(nsAString & _retval)
{
  // printf("mozSecureBrowser::GetVoiceName\n"); 

  if (mUseStoredVoiceName) 
  {
    _retval.Assign(mVoiceName);
    return NS_OK;
  }

  /** 
   * IMPORTANT - format of text output of this shell script MUST be single line
   *   eg:
   *       ked_diphone
   */
  nsAutoString shellPath(NS_LITERAL_STRING(".GetVoiceName.sh"));  

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) 
  {
    nsresult rv = GetShellScriptOutputAsAString(shellPath, _retval);

    if (NS_FAILED(rv)) 
    {
      printf("-------- GetVoiceName SHELL SCRIPT ERROR --------\n");
      return rv;
    }

    return NS_OK;
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetVoiceName(const nsAString & aVoiceName)
{
  // printf("mozSecureBrowser::SetVoiceName (%s)\n", NS_ConvertUTF16toUTF8(aVoiceName).get()); 

  Stop();

  if (mUseStoredVoiceName) 
  {
    mVoiceName.Assign(aVoiceName);
    return NS_OK;
  }

  nsAutoString shellPath(NS_LITERAL_STRING(".SetVoiceName.sh"));  

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) 
  {
    // append a space then aVoiceName as argument to script
    shellPath.Append(NS_LITERAL_STRING(" "));
    shellPath.Append(aVoiceName);
    int retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
    if (retval == 0) printf("-------- call to shell script [%s] FAILED --------\n", NS_ConvertUTF16toUTF8(shellPath).get());

    return NS_OK;
  }

  nsAutoString end;
  end.Assign(NS_LITERAL_STRING("(voice_"));
  end.Append(aVoiceName);
  end.Append(NS_LITERAL_STRING(")"));

  // printf("%s\n", NS_ConvertUTF16toUTF8(end).get());
  
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetVolume(int32_t *_retval)
{
  // printf("mozSecureBrowser::GetVolume\n"); 

  *_retval = mVol;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetVolume(int32_t aVolume)
{
  // printf("mozSecureBrowser::SetVolume\n"); 

  if (aVolume < 0) aVolume = 0;

  if (aVolume > 10) aVolume = 10;

  mVol = aVolume;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetRate(int32_t *aRate)
{
  // printf("mozSecureBrowser::GetRate\n");

  nsresult error;
  *aRate = mRate.ToInteger(&error);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetRate(int32_t aRate)
{
  // printf("mozSecureBrowser::SetRate\n");

  if (aRate > 20) aRate = 20;
  if (aRate < 0)  aRate = 1;

  PRFloat64 n = (aRate * .1);

  if (aRate == 10) strcpy(mRateChar, "1");

  else sprintf(mRateChar, "%.2f", n);

  // printf("-------- mRateChar(%s) --------\n", mRateChar);

  mRate.Assign(NS_LITERAL_STRING(""));
  mRate.AppendInt(aRate);

  // persist rate
  mPrefs->SetIntPref("securebrowser.tts.rate", aRate);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetPitch(int32_t *aPitch)
{
  // printf("mozSecureBrowser::GetPitch\n");

  nsresult error;
  *aPitch = mPitch.ToInteger(&error);

  // printf("-------- Pitch (%d) --------\n", *aPitch);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetPitch(int32_t aPitch)
{
  // printf("mozSecureBrowser::SetPitch\n");

  if (aPitch > 20) aPitch = 20;

  if (aPitch < 0) aPitch = 0;

  // convert 1-20 to -500 to 500

  PRFloat64 n = (1000/19) * (aPitch - 1) - 500;

  mPitchInt = (int)n;

  // flatten out pitch to 0
  if (aPitch == 10) mPitchInt = 0;

  // printf("-------- Pitch (%d) --------\n", mPitchInt);

  mPitch.Assign(NS_LITERAL_STRING(""));
  mPitch.AppendInt(aPitch);

  // persist pitch
  mPrefs->SetIntPref("securebrowser.tts.pitch", aPitch);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetStatus(nsAString & _retval)
{
  // printf("mozSecureBrowser::GetStatus\n"); 

  if (mStatus.Equals(NS_LITERAL_STRING("Playing"))) 
  {
    // printf("USE PS TO SEE IF ITS STILL PLAYING ...\n");

    FILE *fp = NULL;
    char path[MAX_PATH];

    nsAutoString name(NS_LITERAL_STRING(".GetStatus.sh"));
    GetShellScript(name, &fp);

    if (!fp) fp = popen("ps -u `whoami` -o comm | grep play", "r");

    if (fp == NULL) return NS_ERROR_FAILURE;

    nsAutoString out;

    while(!feof(fp))
    {
      if (fgets(path, sizeof(path), fp) != NULL)
      {
        if (out.Length()) out.Append(NS_LITERAL_STRING(","));

        // printf("%s", path);

        out.Append(NS_ConvertUTF8toUTF16(path).get());

        out.StripWhitespace();
      }
    }

    if (out.IsEmpty()) 
    {
      mStatus.Assign(NS_LITERAL_STRING("Stopped"));
    }
      else 
    {
      int status = pclose(fp);

      if (status == -1) printf("mozSecureBrowser::GetStatus:FAILED TO CLOSE FILE STREAM \n"); 
    }
  }

  _retval.Assign(mStatus);

  return NS_OK;
}


NS_IMETHODIMP
mozSecureBrowser::GetVoices(nsAString & aVoices)
{
  // printf("mozSecureBrowser::GetVoices\n"); 

  /** 
   * IMPORTANT - format of text output of this shell script MUST be single line
   *   eg:
   *       kal_diphone
   *       ked_diphone
   */
  nsAutoString shellPath(NS_LITERAL_STRING(".GetVoices.sh"));  

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) 
  {
    nsresult rv = GetShellScriptOutputAsJSObject(shellPath, aVoices);

    if (NS_FAILED(rv)) 
    {
      printf("-------- GetVoices SHELL SCRIPT ERROR --------\n");
      return rv;
    }

    mUseStoredVoiceName = true;

    return NS_OK;
  }

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
  mSystemCall = PR_TRUE;
  // printf("mozSecureBrowser::GetSystemVolume (%s) \n", mSystemCall ? "TRUE" : "FALSE");

  if (mSystemMute)
  {
    *aVolume = 0;
    mSystemCall = PR_FALSE;
    return NS_OK;
  }

  int i = 0;
  int len = GetCards();

  while (NS_FAILED(GetSystemVolumeInternal(i, aVolume)) && i<len) ++i;

  mSystemCall = PR_FALSE;

  return NS_OK;
}

nsresult
mozSecureBrowser::GetSystemVolumeInternal(int32_t aCardNumber, int32_t *aVolume)
{
  // printf("mozSecureBrowser::GetSystemVolumeInternal(%s)\n", mSystemCall ? "TRUE" : "FALSE");

  // amixer -c 0 sget Front,0  | grep % | sed -e's/Front Left: Playback [0-9]*\s\[//g' | sed -e's/%\].*//g'

  // const char* cmd;
  char cmd[MAX_PATH];

  // headphones
  // const char* hcmd = "amixer -c1 sget Speaker,0 | grep % | sed -e's/Front Right: Playback [0-9]*\\s\\[//g' | sed -e's/%\\].*//g' | sed /Left/d";

  // printf("%s\n", hcmd);

  // amixer get Master | grep % | sed '3d' | sed '2d' | sed -e's:%.*$::g' | sed -e's:^.*\[::g'
  // sprintf(cmd, "amixer get Master | grep %% | sed '3d' | sed '2d' | sed -e's:%%.*$::g' | sed -e's:^.*\\[::g'");
  sprintf(cmd, "amixer get Master | grep %% | sed '3d' | sed '2d' | sed -e's:%%.*$::g' | sed -e's:^.*\\[::g'");

  FILE *fp = NULL;
  char volume[MAX_PATH];

  // printf("%s\n", cmd);

  nsAutoString name(NS_LITERAL_STRING(".GetSystemVolume.sh"));
  GetShellScript(name, &fp);

  if (!fp) fp = popen(cmd, "r");

  if (fp == NULL) return NS_ERROR_FAILURE;

  nsAutoString out;

  while(!feof(fp))
  {
    if (fgets(volume, sizeof(volume), fp) != NULL)
    {
      // printf("GET VOLUME: %s", volume);

      out.Assign(NS_ConvertUTF8toUTF16(volume).get());

      out.StripWhitespace();

      int status = pclose(fp);

      if (status == -1) printf("mozSecureBrowser::GetSystemVolumeInternal:FAILED TO CLOSE FILE STREAM \n"); 

      break;
    }
  }

  nsresult rv = NS_OK;

  // printf("******** GET SYSTEM VOLUME INTERNAL %s ********\n", NS_ConvertUTF16toUTF8(out).get());

  if (out.IsEmpty()) rv = NS_ERROR_FAILURE;

  nsresult error;
  *aVolume = out.ToInteger(&error)/10;

  // printf("Headphone Volume [%d]\n", hVol);
  // printf("Master Volume [%d]\n", *aVolume);

  
  // printf("******** GetSystemVolumeInternal NS_OK ********\n");

  return rv;
}

NS_IMETHODIMP
mozSecureBrowser::SetSystemVolume(int32_t aVolume)
{
  // printf("mozSecureBrowser::SetSystemVolume (%d) SetSystemVolume(%s)\n", aVolume, mSystemCall ? "TRUE" : "FALSE");

  if (mSystemCall) return SetSystemVolume(aVolume);

  if (mSystemMute) 
  {
    SetSystemMute(false);
    GetSystemVolume(&aVolume);
  }

  mSystemMute = false;

  if (aVolume < 0) aVolume = 0;

  if (aVolume > 10) aVolume = 10;

  // printf("******** SET VOLUME %d ********\n", aVolume);

  int len = GetCards();

  // printf("******** Number of Cards [%d] ********\n", len);

  int i = 0;
  while (NS_FAILED(SetSystemVolumeInternal(i, aVolume)) && i<len) ++i;

  i = 0;
  while (NS_FAILED(SetSystemHeadphoneVolumeInternal(i, aVolume)) && i<len) ++i;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetSystemMute(bool *aSystemMute)
{
  *aSystemMute = mSystemMute;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetSystemMute(bool aSystemMute)
{
  // printf("******** SET MUTE (%d) ********\n", aSystemMute);

  int len = GetCards();
  int retval = 0;

  if (aSystemMute) 
  {
    retval = system("amixer -D pulse set Master mute > /dev/null 2>&1");
    if (retval == 0) printf("-------- call to SetSystemMute FAILED --------\n");

    retval = system("amixer set Master mute  > /dev/null 2>&1");
    if (retval == 0) printf("-------- call to SetSystemMute [FAILED] --------\n");

    for (int i=0; i<len; ++i) 
    {
      char cmd[MAX_PATH];
      sprintf(cmd, "for c in $(amixer | grep Simple | grep -o \\'.*\\' | sort | uniq | sed -e's: :_:g' | sed ':a;N;$!ba;s/\\n/ /g'); do n=`echo $c | sed -e's:_: :g'`; amixer -q -c%d sset $n,0 mute > /dev/null 2>&1; amixer -q -c%d sset Speaker,0 mute > /dev/null 2>&1; done", i, i);

      retval = system(cmd);
      if (retval == 0) printf("-------- call to cmd [%s] FAILED --------\n", cmd);
    }

    GetSystemVolume(&mLastMuteVol);
  }
    else
  {
    retval = system("amixer -D pulse set Master unmute > /dev/null 2>&1");
    if (retval == 0) printf("-------- call to SetSystemMute unmute FAILED--------\n");

    retval = system("amixer set Master unmute > /dev/null 2>&1");
    if (retval == 0) printf("-------- call to SetSystemMute unmute [FAILED] --------\n");

    for (int i=0; i<len; ++i) 
    {
      char cmd[MAX_PATH];
      sprintf(cmd, "for c in $(amixer | grep Simple | grep -o \\'.*\\' | sort | uniq | sed -e's: :_:g' | sed ':a;N;$!ba;s/\\n/ /g'); do n=`echo $c | sed -e's:_: :g'`; amixer -q -c%d sset $n,0 unmute > /dev/null 2>&1; amixer -q -c%d sset Speaker,0 unmute > /dev/null 2>&1; done", i, i);

      retval = system(cmd);
      if (retval == 0) printf("-------- call to cmd [%s] FAILED --------\n", cmd);
      // printf("%s\n", cmd);
    }
  }
  
  mSystemMute = aSystemMute;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetPermissive(bool *aPermissive)
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetPermissive(bool aPermissive)
{
  return NS_OK;
}

nsresult
mozSecureBrowser::SetSystemVolumeInternal(PRInt32 aCardNumber, PRInt32 aVolume)
{
  // printf("-------- mozSecureBrowser::SetSystemVolumeInternal card(%d) volume(%d) mSystemCall(%s) --------\n", aCardNumber, aVolume, mSystemCall ? "TRUE" : "FALSE");

  if (mSystemCall) return SetSystemVolumeInternal(aCardNumber, aVolume);

  nsAutoString b;

  PRInt32 vol = aVolume * 10;

  int retval;

  nsAutoString shellPath(NS_LITERAL_STRING(".SetSystemVolume.sh"));

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) 
  {
    shellPath.Append(NS_LITERAL_STRING(" volume "));
    shellPath.AppendInt(vol);

    shellPath.Append(NS_LITERAL_STRING(" cardnumber "));
    shellPath.AppendInt(aCardNumber);

    retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
  } 
    else
  {
    b.AssignLiteral("amixer set Master ");
    b.AppendInt(vol);
    b.AppendLiteral("% > /dev/null 2>&1");

    // printf("******** SET MASTER VOLUME: [%s] ********\n", NS_ConvertUTF16toUTF8(b).get());
    retval = system(NS_ConvertUTF16toUTF8(b).get());

    int len = GetCards();

    // printf("******** CARDS: [%d] ********\n", len);

    if (len > 1)
    {
      for (int i=0; i<len; ++i) 
      {
        char cmd[MAX_PATH];
        sprintf(cmd, "for c in $(amixer | grep Simple | grep -o \\'.*\\' | sort | uniq | sed -e's: :_:g' | sed ':a;N;$!ba;s/\\n/ /g'); do n=`echo $c | sed -e's:_: :g'`; amixer -q -c%d sset $n,0 %d%% > /dev/null 2>&1; amixer -q -c%d sset Speaker,0 %d%% > /dev/null 2>&1; done", i, vol, i, vol);

        // printf("%s\n", cmd);

        retval = system(cmd);
        if (retval == 0) printf("-------- call to cmd [%s] FAILED --------\n", cmd);
      }
    }
  }

  if (retval != 0) 
  {
    printf("-------- SET SYSTEM VOLUME ERROR --------\n");
    return NS_ERROR_FAILURE;
  }
  
  return NS_OK;
}

nsresult
mozSecureBrowser::SetSystemHeadphoneVolumeInternal(PRInt32 aCardNumber, PRInt32 aVolume)
{
  // printf("-------- mozSecureBrowser::SetSystemHeadphoneVolumeInternal card(%d) volume(%d) mSystemCall(%s) --------\n", aCardNumber, aVolume, mSystemCall ? "TRUE" : "FALSE");

  if (mSystemCall) return SetSystemHeadphoneVolumeInternal(aCardNumber, aVolume);

  nsAutoString h,a;

  // usb headphones
  // amixer -c1 sset Speaker,0 100% 100%
  h.AssignLiteral("amixer -q -c");
  h.AppendInt(aCardNumber);
  h.AppendLiteral(" sset Speaker,0 ");

  PRInt32 vol = aVolume * 10;

  h.AppendInt(vol);
  h.AppendLiteral("% ");

  h.AppendInt(vol);
  h.AppendLiteral("%");

  // hide output as card may not be present
  h.AppendLiteral(" > /dev/null 2>&1");

  a.AssignLiteral("amixer set Headphone ");
  a.AppendInt(vol);
  a.AppendLiteral("% ");
  a.AppendLiteral("> /dev/null 2>&1");

  // printf("******** Headphones [%s] ********\n", NS_ConvertUTF16toUTF8(a).get());

  int retval;

  // amixer set Headphone
  retval = system(NS_ConvertUTF16toUTF8(a).get());

  // printf("******** retval [%d] ********\n", retval);

  if (retval != 0) printf("-------- SET HEADPHONE VOLUME ERROR (%d) --------\n", retval);

  nsAutoString shellPath(NS_LITERAL_STRING(".SetSystemHeadphoneVolume.sh"));

  // shellPath will change from leafName to full Linux path if it exists
  if (ShellScriptExists(shellPath)) 
  {
    shellPath.Append(NS_LITERAL_STRING(" volume "));
    shellPath.AppendInt(vol);

    shellPath.Append(NS_LITERAL_STRING(" cardnumber "));
    shellPath.AppendInt(aCardNumber);

    retval = system(NS_ConvertUTF16toUTF8(shellPath).get());
  } 
    else 
  {
    // printf("******** Headphones [%s] ********\n", NS_ConvertUTF16toUTF8(h).get());
    retval = system(NS_ConvertUTF16toUTF8(h).get());
    if (retval != 0) printf("-------- SET SPEAKER VOLUME ERROR (%d) --------\n", retval);
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetSoxVersion(nsAString & aSoxVersion)
{
  aSoxVersion.Assign(mSoxVersion);

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
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::KillProcess(const nsAString & aProcessName)
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::StartProcess(const nsAString & aPath)
{
  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetOSversion(nsAString & _retval)
{
  // printf("mozSecureBrowser::GetOSversion\n");

  // lsb_release -a | grep Description: | sed -e's/Description://g'

  _retval.AssignLiteral("");

  FILE *fp = NULL;
  char path[MAX_PATH];

  nsAutoString out;

  fp = popen("cat /etc/fedora-release 2> /dev/null | sed -e 's:release ::'", "r");

  while(!feof(fp))
  {
    if (fgets(path, sizeof(path), fp) != NULL)
    {
      // printf("fedora-release: [%s]\n", path);

      out.Assign(NS_ConvertUTF8toUTF16(path).get());

      out.Trim("\t\n\r\f", true, true);
    }
  }

  fp = popen("cat /etc/centos-release 2> /dev/null | sed -e 's:release ::'", "r");

  while(!feof(fp))
  {
    if (fgets(path, sizeof(path), fp) != NULL)
    {
      // printf("centos-release: [%s]\n", path);

      out.Assign(NS_ConvertUTF8toUTF16(path).get());

      out.Trim("\t\n\r\f", true, true);
    }
  }


  int status = pclose(fp);

  if (status == -1) printf("mozSecureBrowser::GetOSversion:FAILED TO CLOSE FILE STREAM\n"); 

  fp = popen("lsb_release -a 2> /dev/null | grep Description: | sed -e's/Description://g'", "r");

  if (fp == NULL) return NS_ERROR_FAILURE;

  while(!feof(fp))
  {
    if (fgets(path, sizeof(path), fp) != NULL)
    {
      // printf("lsb_release [%s]\n", path);

      out.Assign(NS_ConvertUTF8toUTF16(path).get());

      out.Trim("\t\n\r\f", true, true);
    }
  }

  status = pclose(fp);

  if (status == -1) printf("mozSecureBrowser::GetOSversion:FAILED TO CLOSE FILE STREAM\n"); 

  out.AppendLiteral(" ");

  fp = NULL;
  fp = popen("uname -m", "r");

  if (fp == NULL) return NS_ERROR_FAILURE;

  while(!feof(fp))
  {
    if (fgets(path, sizeof(path), fp) != NULL)
    {
      // printf("uname [%s]\n", path);

      out.Append(NS_ConvertUTF8toUTF16(path).get());

      out.Trim("\t\n\r\f", true, true);
    }
  }

  _retval = out;

  // printf("OSVersion: [%s]\n", NS_ConvertUTF16toUTF8(out).get());

  // printf("******** fp(%p) ********\n", (void*)fp);

  status = pclose(fp);

  if (status == -1) printf("mozSecureBrowser::GetOSversion:FAILED TO CLOSE FILE STREAM\n"); 

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetEnvVariable(const nsAString & name, nsAString & _retval)
{
  const char *v = getenv(NS_ConvertUTF16toUTF8(name).get());

  printf ("mozSecureBrowser::GetEnvVariable [%s]\n", v);

  if (!v) v = "";

  _retval.AssignLiteral(v);

  return NS_OK;
}


void
mozSecureBrowser::PrintPointer(const char* aName, nsISupports* aPointer)
{
  printf ("%s (%p)\n", aName, (void*)aPointer);
}

