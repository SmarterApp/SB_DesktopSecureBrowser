// *******************************************************************************
// Educational Online Test Delivery System
// Copyright (c) 2017 American Institutes for Research
//
// Distributed under the AIR Open Source License, Version 1.0
// See accompanying file AIR-License-1_0.txt or at
// http://www.smarterapp.org/documents/American_Institutes_for_Research_Open_Source_Software_License.pdf
// *******************************************************************************
// SB header file
#include "mozSecureBrowserOSX.h"

// Mozilla includes
#include "nsEmbedString.h"
#include "nsIClassInfoImpl.h"
#include "nsObjCExceptions.h"
#include "nsIObserverService.h"
#include "nsComponentManagerUtils.h"
#include "nsILocalFileMac.h"
#include "nsIProcess.h"

// For GetMACAddress
#include <sys/socket.h>
#include <sys/sysctl.h>
#include <net/if.h>
#include <net/if_dl.h>
#include <stdlib.h>

#include <Carbon/Carbon.h>

bool gDidFinishSpeaking = true;

@interface SpeechSynthDelegate : NSObject <NSSpeechSynthesizerDelegate> 
{
  nsCOMPtr<nsIObserverService> mOS;
}
@end

@implementation SpeechSynthDelegate
- (void)initDelegate
{
  mOS = do_GetService("@mozilla.org/observer-service;1");
}

- (void)speechSynthesizer:(NSSpeechSynthesizer *)aSender willSpeakWord:(NSRange)aWordToSpeak ofString:(NSString *)aText
{
  nsAutoString msg;
  msg.Assign(NS_LITERAL_STRING("WordStart:"));

  PRInt64 start = aWordToSpeak.location;
  msg.AppendInt(start);

  msg.Append(NS_LITERAL_STRING(", WordLength:"));

  PRInt64 length = aWordToSpeak.length;
  msg.AppendInt(length);

  if (mOS) mOS->NotifyObservers(nullptr, "sb-word-speak", msg.get());
}

- (void) speechSynthesizer:(NSSpeechSynthesizer *)aSender didEncounterSyncMessage:(NSString *)aMessage
{
  nsAutoString msg;
  msg.Assign(NS_LITERAL_STRING("Sync"));

  if (mOS) mOS->NotifyObservers(nullptr, "sb-word-speak", msg.get());
}

- (void)speechSynthesizer:(NSSpeechSynthesizer *)aSender willSpeakPhoneme:(short)aPhonemeOpcode
{
  nsAutoString msg;
  msg.Assign(NS_LITERAL_STRING("Phoneme"));

  if (mOS) mOS->NotifyObservers(nullptr, "sb-word-speak", msg.get());
}

- (void)speechSynthesizer:(NSSpeechSynthesizer *)aSender didFinishSpeaking:(BOOL)aSuccess
{
  // printf("-------- didFinishSpeaking --------\n");

  gDidFinishSpeaking = true;

  nsAutoString msg;
  msg.Assign(NS_LITERAL_STRING("Done"));

  if (mOS) mOS->NotifyObservers(nullptr, "sb-word-speak", msg.get());
}
@end

mozSecureBrowser::mozSecureBrowser() :
  mSpeechSynthesizer(nullptr),
  mListenerInitialized(false)
{
  Log("CREATE");

  mPrefs = do_GetService(NS_PREFSERVICE_CONTRACTID);

  mPrefs->GetIntPref("securebrowser.tts.pitch", &mPitch);
  mPrefs->GetIntPref("securebrowser.tts.rate", &mRate);

  mStatus.Assign(NS_LITERAL_STRING("Stopped"));

  SetRate(mRate);
  SetPitch(mPitch);
}

mozSecureBrowser::~mozSecureBrowser() 
{
  Log("DESTROY");

  if (mSpeechSynthesizer) [mSpeechSynthesizer release];
}

NS_IMPL_ISUPPORTS(mozSecureBrowser, mozISecureBrowser)

nsresult
mozSecureBrowser::Init()
{
  mPermissive = false;

  if (mPrefs)
  {
    // printf("------ mKillProcess(%d) ------\n", mKillProcess);  

    mPrefs->GetBoolPref("securebrowser.system.enableKillProcess", &mKillProcess);
    mPrefs->GetBoolPref("securebrowser.system.shutdownOnNewProcess", &mShutDown);

    // printf("------ mKillProcess(%d) ------\n", mKillProcess);  
    // printf("------ mShutDown(%d) ------\n", mShutDown);  
  }

  InitSpeechSynthesizer();

  return NS_OK;
}

nsresult
mozSecureBrowser::InitSpeechSynthesizer()
{
  if (mSpeechSynthesizer) return NS_OK;

  // Log("INITIALIING SPEECH SYNTHESIZER...");

  // Other ways to initialize the Speech Synthesizer
  // mSpeechSynthesizer = [[NSSpeechSynthesizer alloc] init]; // start with default voice
  // mSpeechSynthesizer = [[NSSpeechSynthesizer alloc] initWithVoice:@"com.apple.speech.synthesis.voice.Victoria"];
  // mSpeechSynthesizer = [[NSSpeechSynthesizer alloc] initWithVoice:[NSSpeechSynthesizer defaultVoice]];

  if (!mSpeechSynthesizer) mSpeechSynthesizer = [[NSSpeechSynthesizer alloc] initWithVoice:[NSSpeechSynthesizer defaultVoice]];

  // printf("mSpeechSynthesizer (%p)\n", (void*)mSpeechSynthesizer);

  // commenting out this line as when on tab content js scope 
  // SpeechSynthesizer will not initialize - only from chrome
  // if (!mSpeechSynthesizer) Log("ERROR INITIALIING SPEECH SYNTHESIZER");

  // actualize the player
  if (mSpeechSynthesizer) Play(NS_LITERAL_STRING(" "));

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetVersion(nsAString & aVersion)
{
  aVersion = NS_LITERAL_STRING(MOZ_APP_UA_VERSION);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetServices(nsAString & _retval)
{
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
  // used to test a crash...
  // abort(); 

  nsAutoString out;

  for (NSRunningApplication *currApp in [[NSWorkspace sharedWorkspace] runningApplications]) 
  {
    // NSLog(@"GetRunningProcessList:  %@", [currApp localizedName]);

    if (out.Length()) out.Append(NS_LITERAL_STRING(","));

    out.AppendLiteral([[currApp localizedName] UTF8String]);
    // out.Append(NS_LITERAL_STRING("|NA"));			// Parent processname
  }

  _retval.Assign(out); 

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetMACAddress(nsAString & _retval)
{
  NSTask *task = [[NSTask alloc] init];
  [task setLaunchPath:@"/bin/sh"];
  [task setArguments:@[@"-c", @"/sbin/ifconfig | grep 'ether ' | sed '2,$d' | sed -e's:^.*ether ::g'"]];

  NSPipe * out = [NSPipe pipe];
  [task setStandardOutput:out];

  [task launch];
  [task waitUntilExit];
  [task release];

  NSFileHandle * read = [out fileHandleForReading];
  NSData * dataRead = [read readDataToEndOfFile];
  NSString * eth0 = [[[NSString alloc] initWithData:dataRead encoding:NSUTF8StringEncoding] autorelease];

  // NSLog(@"output: %@", eth0);
  // printf("-------- MAC Address [%s] --------", [eth0 UTF8String]);

  nsAutoString eth0_MACAddress;
  eth0_MACAddress.AppendLiteral([eth0 UTF8String]);

  eth0_MACAddress.StripWhitespace();

  _retval.Assign(eth0_MACAddress); 

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Initialize()
{
  bool dispose;
  mPrefs->GetBoolPref("securebrowser.speech.disposeSpeechChannel", &dispose);

  if (dispose)
  {
    mSpeechSynthesizer = nullptr;
    mSpeechSynthesizer = [[NSSpeechSynthesizer alloc] init]; // reinitialize
  }

  if (!mSpeechSynthesizer) InitSpeechSynthesizer();

  // InitializeListener(NS_LITERAL_STRING(""));

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Uninitialize()
{
  return NS_ERROR_NOT_IMPLEMENTED;
}

NS_IMETHODIMP
mozSecureBrowser::InitializeListener(const nsAString & type)
{
  if (!mListenerInitialized)
  {
    SpeechSynthDelegate* speechDelegate = [[SpeechSynthDelegate alloc] init];
    [mSpeechSynthesizer setDelegate:speechDelegate];
    [speechDelegate initDelegate];

    mListenerInitialized = true;
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Play(const nsAString & text)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  NSString* string = [[NSString alloc] initWithUTF8String:NS_ConvertUTF16toUTF8(text).get()];
  [mSpeechSynthesizer startSpeakingString:string];

  mStatus.Assign(NS_LITERAL_STRING("Playing"));

  gDidFinishSpeaking = false;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Pause()
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  if (mStatus.Equals(NS_LITERAL_STRING("Playing"))) mStatus.Assign(NS_LITERAL_STRING("Paused"));

  [mSpeechSynthesizer pauseSpeakingAtBoundary:NSSpeechImmediateBoundary];

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Stop()
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  [mSpeechSynthesizer stopSpeaking];

  mStatus.Assign(NS_LITERAL_STRING("Stopped"));

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::Resume()
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  if (mStatus.Equals(NS_LITERAL_STRING("Paused"))) mStatus.Assign(NS_LITERAL_STRING("Resume Play"));

  [mSpeechSynthesizer continueSpeaking];

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetVoiceName(nsAString & _retval)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  _retval.AssignLiteral([[mSpeechSynthesizer voice] UTF8String]);

  // printf("-------- GetVoiceName (%s) --------\n", NS_ConvertUTF16toUTF8(_retval).get());

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetVoiceName(const nsAString & aVoiceName)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  // printf("-------- SetVoiceName (%s) --------\n", NS_ConvertUTF16toUTF8(aVoiceName).get());

  NSString* voice = [[NSString alloc] initWithUTF8String:NS_ConvertUTF16toUTF8(aVoiceName).get()];

  [mSpeechSynthesizer setVoice:voice];

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetVolume(int32_t *aVolume)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  // Speaking volume range: From 0.0 to 1.0
  float volume = [mSpeechSynthesizer volume];

  *aVolume = lroundf(volume*10);

  // NSLog(@"GetVolume Sys(%.2f)", volume);
  // NSLog(@"GetVolume Out(%d)", *aVolume);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetVolume(int32_t aVolume)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  if (aVolume < 0) aVolume = 0;
  if (aVolume > 10) aVolume = 10;

  float volume = (aVolume*.10);

  // NSLog(@"SetVolume In(%d)", aVolume);
  // NSLog(@"SetVolume Sys(%.2f)", volume);

  // Speaking volume range: From 0.0 to 1.0
  [mSpeechSynthesizer setVolume:volume];

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetRate(int32_t *aRate)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  float rate = [mSpeechSynthesizer rate];

  float res = (rate - 100)/6;

  *aRate = (int)res;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetRate(int32_t aRate)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  // Average human speech occurs at a rate of 180 to 220 words per minute

  if (aRate < 0) aRate = 0;

  if (aRate > 20) aRate = 20;

  float rate = (6 * aRate) + 100;

  [mSpeechSynthesizer setRate:rate];

  mPrefs->SetIntPref("securebrowser.tts.rate", aRate);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetPitch(int32_t *aPitch)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  NSError *err;
  NSNumber *pitch = [mSpeechSynthesizer objectForProperty:NSSpeechPitchBaseProperty error:&err];

  // pitch values in the ranges of 30 to 65
  float newVal = ([pitch floatValue]-30)/1.75;
  
  if (newVal < 1) *aPitch = 0; 
  else *aPitch = (int)lroundf(newVal);

  if (*aPitch > 20) *aPitch = 20;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetPitch(int32_t aPitch)
{
  if (!mSpeechSynthesizer) return NS_ERROR_NOT_INITIALIZED;

  if (aPitch <= 0) aPitch = 0;
  if (aPitch > 20) aPitch = 20;

  float fin = (float)aPitch;
  float newVal = (1.75*fin) + 30;

  NSError *err;
  NSNumber *pitch = [NSNumber numberWithFloat:newVal];
  [mSpeechSynthesizer setObject:pitch forProperty:NSSpeechPitchBaseProperty error:&err];

  mPrefs->SetIntPref("securebrowser.tts.pitch", aPitch);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetStatus(nsAString & _retval)
{
  _retval.Assign(mStatus);

  if (!mStatus.Equals(NS_LITERAL_STRING("Paused")) && gDidFinishSpeaking)
  {
    // printf("gDidFinishSpeaking [%s]\n", gDidFinishSpeaking ? "TRUE" : "FALSE");
    _retval.Assign(NS_LITERAL_STRING("Stopped"));
    mStatus.Assign(_retval);
  }

  if (mStatus.Equals(NS_LITERAL_STRING("Resume Play")))
  {
    _retval.Assign(NS_LITERAL_STRING("Playing"));
    mStatus.Assign(_retval);

    return NS_OK;
  }

  /********
  if (![NSSpeechSynthesizer isAnyApplicationSpeaking] && !mStatus.Equals(NS_LITERAL_STRING("Paused")) && gDidFinishSpeaking) 
  {
    _retval.Assign(NS_LITERAL_STRING("Stopped"));
    mStatus.Assign(_retval);
  }
  ********/

  return NS_OK;
}


NS_IMETHODIMP
mozSecureBrowser::GetVoices(nsAString & _retval)
{
  NSArray *voices = [NSSpeechSynthesizer availableVoices];
  NSString *voice;

  nsAutoString str, out;

  for (voice in voices) 
  {
    if (out.Length()) out.Append(NS_LITERAL_STRING("|"));

    NSString *name = [[NSSpeechSynthesizer attributesForVoice:voice] objectForKey:NSVoiceName];
    NSString *gender = [[NSSpeechSynthesizer attributesForVoice:voice] objectForKey:NSVoiceGender];
    NSString *lang = [[NSSpeechSynthesizer attributesForVoice:voice] objectForKey:NSVoiceLanguage];

    if ([gender compare:@"VoiceGenderFemale"]) gender = @"female";
    else if ([gender compare:@"VoiceGenderMale"]) gender = @"male";
    else if ([gender compare:@"VoiceGenderNeuter"])gender = @"neutral";

    // printf("ID [%s]\n", [voice UTF8String]);
    // printf("VoiceName [%s] Gender [%s] Lang [%s]\n", [name UTF8String], [gender UTF8String], [lang UTF8String]);

    out.Append(NS_LITERAL_STRING("{ name: '"));
    out.AppendLiteral([name UTF8String]); 
    out.Append(NS_LITERAL_STRING("', gender: '"));
    out.AppendLiteral([gender UTF8String]); 
    out.Append(NS_LITERAL_STRING("', lang: '"));
    out.AppendLiteral([lang UTF8String]); 
    out.Append(NS_LITERAL_STRING("', id: '"));
    out.AppendLiteral([voice UTF8String]); 
    out.Append(NS_LITERAL_STRING("' }"));
  }

  _retval.Assign(out);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetKey(nsAString & _retval)
{
  return NS_OK;
}

AudioDeviceID 
mozSecureBrowser::GetDefaultAudioDevice()
{
  OSStatus err;
  AudioDeviceID device = 0;
  UInt32 size = sizeof(AudioDeviceID);

  AudioObjectPropertyAddress address = {
      kAudioHardwarePropertyDefaultOutputDevice,
      kAudioObjectPropertyScopeGlobal,
      kAudioObjectPropertyElementMaster
  };

  err = AudioObjectGetPropertyData(kAudioObjectSystemObject,
                                   &address,
                                   0,
                                   NULL,
                                   &size,
                                   &device);

  if (err) NSLog(@"could not get default audio output device");

  return device;
}

NS_IMETHODIMP
mozSecureBrowser::GetSystemVolume(int32_t *aSystemVolume)
{
  Float32 volume = 0;
  UInt32 size = sizeof(Float32);

  AudioObjectPropertyAddress address = { 
    kAudioDevicePropertyVolumeScalar,
    kAudioDevicePropertyScopeOutput,
    1 // channel 1
  };

  AudioDeviceID device = GetDefaultAudioDevice();

  OSStatus err = AudioObjectGetPropertyData(device,
                                            &address,
                                            0,
                                            NULL,
                                            &size,
                                            &volume);

  // NSLog(@"volume(%.2f)", volume);

  if (err != noErr) 
  {
    // NSLog(@"GetSystemVolume:No volume returned for device. Falling back on master channel");

    AudioObjectPropertyAddress address2 = { 
      kAudioDevicePropertyVolumeScalar,
      kAudioDevicePropertyScopeOutput,
      0 // master channel
    };

    Float32 v = 0;
    UInt32 s = sizeof(Float32);

    err = AudioObjectGetPropertyData(device,
                                     &address2,
                                     0,
                                     NULL,
                                     &s,
                                     &v);

    volume = v;

    if (err != noErr) 
    {
      NSLog(@"GetSystemVolume: ALL ATTEMPTS FAILED...");
      return NS_ERROR_FAILURE;
    }
  }

  Float32 f = volume * 10;
  *aSystemVolume = (int)round(f);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetSystemVolume(int32_t aSystemVolume)
{
  Float32 volume = (Float32)aSystemVolume/10;
  UInt32 size = sizeof(Float32);

  AudioObjectPropertyAddress address = { 
    kAudioDevicePropertyVolumeScalar,
    kAudioDevicePropertyScopeOutput,
    1 
  };

  AudioDeviceID device = GetDefaultAudioDevice();

  // set channel 0
  OSStatus err = AudioObjectSetPropertyData(device, &address, 0, NULL, size, &volume);

  address = { 
    kAudioDevicePropertyVolumeScalar,
    kAudioDevicePropertyScopeOutput,
    2 
  };

  // set channel 1
  err = AudioObjectSetPropertyData(device, &address, 0, NULL, size, &volume);

  // NSLog(@"volume(%.2f)", volume);

  if (err != noErr) 
  {
    // NSLog(@"SetSystemVolume:channels 1,2 failed attempting master channel...");

    address = { 
      kAudioDevicePropertyVolumeScalar,
      kAudioDevicePropertyScopeOutput,
      0
    };

    // set channel 0
    err = AudioObjectSetPropertyData(device, &address, 0, NULL, size, &volume);

    if (err != noErr) 
    {
      NSLog(@"SetSystemVolume: ALL ATTEMPTS FAILED...");
      return NS_ERROR_FAILURE;
    }
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetSystemMute(bool *aSystemMute)
{
  UInt32 size = sizeof(UInt32);
  UInt32 muteVal;

  AudioObjectPropertyAddress address = {
      kAudioDevicePropertyMute,
      kAudioDevicePropertyScopeOutput,
      0
  };

  AudioDeviceID device = GetDefaultAudioDevice();

  OSStatus err;
  err = AudioObjectGetPropertyData(device,
                                   &address,
                                   0,
                                   NULL,
                                   &size,
                                   &muteVal);

 // NSLog(@"muteVal %u", (unsigned int)muteVal);

  if (err != noErr) 
  {
    NSLog(@"error while getting mute status");
    return NS_ERROR_FAILURE;
  }

  *aSystemMute =  (bool)muteVal;

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::SetSystemMute(bool aSystemMute)
{
  UInt32 muteVal = (UInt32)aSystemMute;

  AudioObjectPropertyAddress address = {
      kAudioDevicePropertyMute,
      kAudioDevicePropertyScopeOutput,
      0
  };

  AudioDeviceID device = GetDefaultAudioDevice();

  OSStatus err;
  err = AudioObjectSetPropertyData(device,
                                   &address,
                                   0,
                                   NULL,
                                   sizeof(UInt32),
                                   &muteVal);
  if (err != noErr)
  {
    NSLog(@"error while %@muting", (aSystemMute ? @"" : @"un"));
    return NS_ERROR_FAILURE;
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
  nsresult rv = SetUIMode(aPermissive);

  nsCOMPtr<nsIObserverService> os;
  os = do_GetService("@mozilla.org/observer-service;1");

  nsAutoString msg;
  if (aPermissive) msg.Assign(NS_LITERAL_STRING("ON"));
  else msg.Assign(NS_LITERAL_STRING("OFF"));

  if (os) os->NotifyObservers(nullptr, "sb-permissive-mode", msg.get());

  return rv;
}

nsresult
mozSecureBrowser::SetUIMode(bool aPermissive)
{ 
  OSStatus status = noErr;
  
  if (!aPermissive)
  {
    // Log("SETTING TO NOT PERMISSIVE");
    status = SetSystemUIMode(kUIModeAllHidden, kUIOptionDisableProcessSwitch     |
                                               kUIOptionDisableForceQuit         |
                                               kUIOptionDisableSessionTerminate  |
                                               kUIOptionDisableAppleMenu);
    if (status != noErr) 
    {
      Log("ERROR");
      return NS_ERROR_FAILURE;
    }

    // reset back to default
    if (mPrefs)
    {
      mPrefs->SetBoolPref("securebrowser.system.enableKillProcess", mKillProcess);
      mPrefs->SetBoolPref("securebrowser.system.shutdownOnNewProcess", mShutDown);
    }
  }
    else
  {
    // Log("SETTING TO PERMISSIVE");
    status = SetSystemUIMode(kUIModeContentHidden, kUIOptionDisableAppleMenu|kUIOptionDisableProcessSwitch|kUIOptionDisableForceQuit);

    if (status != noErr)
    {
      Log("ERROR");
      return NS_ERROR_FAILURE;
    }

    for (NSRunningApplication *currApp in [[NSWorkspace sharedWorkspace] runningApplications]) 
    {
      // NSLog(@"GetRunningProcessList:  %@", [currApp localizedName]);

      if ([[currApp localizedName] isEqualToString:@"Dock"])
      {
        // NSLog(@"DOCK FOUND!");

        // unhide and activate the Dock 
        [currApp unhide];
        // [currApp activateWithOptions:NSApplicationActivateAllWindows];
        [currApp activateWithOptions:NSApplicationActivateIgnoringOtherApps];

        break;
      }
    }

    if (mPrefs)
    {
      mPrefs->SetBoolPref("securebrowser.system.enableKillProcess", false);
      mPrefs->SetBoolPref("securebrowser.system.shutdownOnNewProcess", false);
    }
  }

  mPermissive = aPermissive;

  if (mPrefs) mPrefs->SetBoolPref("securebrowser.mode.permissive", mPermissive);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::LockScreen(bool aIsAdmin)
{
  OSStatus status = noErr;
  
  if (!aIsAdmin)
  {
    Log("LOCK SYSTEM UI");
    status = SetSystemUIMode(kUIModeAllHidden, kUIOptionDisableProcessSwitch     |
                                               kUIOptionDisableForceQuit         |
                                               kUIOptionDisableSessionTerminate  |
                                               kUIOptionDisableAppleMenu);
    if (status != noErr) 
    {
      Log("ERROR");
      return NS_ERROR_FAILURE;
    }
  }
    else
  {
    printf("-------- UNLOC SYSTEM UI --------\n");
    status = SetSystemUIMode(kUIModeContentHidden, kUIOptionDisableAppleMenu|kUIOptionDisableProcessSwitch|kUIOptionDisableForceQuit);

    if (status != noErr)
    {
      Log("ERROR");
      return NS_ERROR_FAILURE;
    }
  }

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetSoxVersion(nsAString & aSoxVersion)
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
  // nsresult rv;

  printf("START PROCESS... [%s]\n", NS_ConvertUTF16toUTF8(aPath).get());

  return NS_OK;

  /********
  NSString* path = [[NSString alloc] initWithUTF8String:NS_ConvertUTF16toUTF8(aPath).get()];

  NSTask *task = [[NSTask alloc] init];
  [task setLaunchPath:@"/usr/bin/open"];
  [task setArguments:@[path]];

  NSPipe * out = [NSPipe pipe];
  [task setStandardOutput:out];

  [task launch];
  [task waitUntilExit];
  [task release];

  return NS_OK;

  nsCOMPtr<nsIFile> lf;
  rv = NS_NewNativeLocalFile(NS_ConvertUTF16toUTF8(aPath), true, getter_AddRefs(lf));
  NS_ENSURE_SUCCESS(rv, rv);

  bool exists;
 
  printf("EXISTS...\n");

  lf->Exists(&exists);
  if (!exists) return NS_ERROR_FILE_NOT_FOUND;

  printf("PROCESS CREATE INSTANCE...\n");
  nsCOMPtr<nsIProcess> p = do_CreateInstance("@mozilla.org/process/util;1", &rv);
  NS_ENSURE_SUCCESS(rv, rv);

  printf("INITIALIZING PROCESS...\n");
  rv = p->Init(lf);
  NS_ENSURE_SUCCESS(rv, rv);

  printf("RUN PROCESS...\n");
  return p->Run(false, 0, 0);
  ********/
}

NS_IMETHODIMP
mozSecureBrowser::GetOSversion(nsAString & aVersion)
{
  SInt32 versMaj, versMin, versBugFix;

  Gestalt(gestaltSystemVersionMajor, &versMaj);
  Gestalt(gestaltSystemVersionMinor, &versMin);
  Gestalt(gestaltSystemVersionBugFix, &versBugFix);

  nsAutoString rv;

  rv.AppendInt(versMaj);
  rv.AppendLiteral(".");
  rv.AppendInt(versMin);
  rv.AppendLiteral(".");
  rv.AppendInt(versBugFix);

  if (versMin == 9)
  {
    aVersion.AppendLiteral("OSX Mavericks ");
    aVersion.Append(rv);
  }

  if (versMin == 10)
  {
    aVersion.AppendLiteral("OSX Yosemite ");
    aVersion.Append(rv);
  }

  if (versMin == 11)
  {
    aVersion.AppendLiteral("OSX El Capitan ");
    aVersion.Append(rv);
  }

  if (versMin == 12)
  {
    aVersion.AppendLiteral("OSX Sierra ");
    aVersion.Append(rv);
  }

  if (versMin > 12)
  {
    aVersion.AppendLiteral("OSX Unknown ");
    aVersion.Append(rv);
  }

  aVersion.AppendLiteral(" ");
  aVersion.AppendLiteral(SECURE_BROWSER_APPNAME);

  return NS_OK;
}

NS_IMETHODIMP
mozSecureBrowser::GetEnvVariable(const nsAString & name, nsAString & _retval)
{
  const char *v = getenv(NS_ConvertUTF16toUTF8(name).get());

  // printf ("mozSecureBrowser::GetEnvVariable [%s]\n", v);

  _retval.AssignLiteral(v);

  return NS_OK;
}

void
mozSecureBrowser::PrintPointer(const char* aName, nsISupports* aPointer)
{
  printf ("%s (%p)\n", aName, (void*)aPointer);
}

void
mozSecureBrowser::Log(const char* aMsg)
{
  printf ("SBCOMPONENT: %s \n", aMsg);
}

