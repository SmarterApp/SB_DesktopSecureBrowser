#
# Automate checkout of the base firefox code and the securebrowser client code.


# set this for newer branches
TARGET_REV=FIREFOX_52_0_RELEASE
BUNDLE_HOST=https://hg.cdn.mozilla.net
BUNDLE_CONFIG_FILE=$(BUNDLE_HOST)/bundles.json
BUNDLE_PATH=""
BUNDLE_EXT=gzip-v2.hg

OS_ARCH = $(shell uname -s)
CPU = $(shell uname -m)

MOZ_CONFIG = mozilla/.mozconfig

thisdir = $(notdir $(shell pwd))

all: checkout

first-checkout: checkout

first-checkout-prod: prodCheckOut

checkout: bundle-checkout securebrowser-checkout applypatch mozconfig 
alt-checkout: bundle-checkout securebrowser-checkout applypatch mozconfig
prodCheckOut: mercurial-checkout securebrowser-checkout-prodBuild applypatch mozconfig

mozilla-checkout: bundle-checkout

fetch-bundle:
	echo fetching bundle file [$(BUNDLE_CONFIG_FILE)];
	wget -N $(BUNDLE_CONFIG_FILE); 

bundle-checkout: fetch-bundle
	@if [ ! -d mozilla ]; then hg init mozilla; fi 
	export BUNDLE_PATH=$(shell grep mozilla-release bundles.json | grep $(BUNDLE_EXT) | sed -e's:^.*"r:r:g' | sed -e's:",::g;');                     \
	export BUNDLE_FILE=$(shell grep mozilla-release bundles.json | grep $(BUNDLE_EXT) | sed -e's:^.*"r:r:g' | sed -e's:",::g;' | sed -e's:^.*/::g'); \
	export BUNDLE_URL=$(BUNDLE_HOST)/$$BUNDLE_PATH;                                                                                                  \
	echo Fetching Mercurial Bundle [$$BUNDLE_URL];                                                                                                   \
	wget -N $$BUNDLE_URL;                                                                                                                            \
	cd mozilla; hg unbundle ../$$BUNDLE_FILE; wait; hg up; wait; hg up -r $(TARGET_REV);


mercurial-checkout:
	@if [ ! -d mozilla ]; then \
	  echo "getting mozilla source from local repo"; \
	  tar xvf ~/mozilla.tar.gz; \
	else \
	  echo "Mozilla source previously cloned. Reverting to checkout state..."; \
	  cd mozilla; hg update -C; hg up -r $(TARGET_REV); \
	  echo "Reverting mozilla changes done.";\
	fi
	
mercurial-checkout-remoterepo:
	  echo "Cloning mozilla source code...";
	  hg clone -r $(TARGET_REV) http://hg.mozilla.org/releases/mozilla-release/ mozilla/;

securebrowser-checkout:
	@if [ ! -d mozilla/securebrowser ]; then \
	  cp -r securebrowser mozilla/; \
	fi

patch: applypatch

applypatch:
	# remove added webild file if it exists so patch can apply
	rm -f mozilla/dom/webidl/Browser.webidl;
ifeq ($(OS_ARCH),MINGW32_NT-6.1)
	@dos2unix.exe securebrowser-core-changes.patch;
endif
	@cd mozilla; patch -p1 < ../securebrowser-core-changes.patch;
	# make sure we add this new file to the mozilla repos so we can 
	# pick up a diff
	cd mozilla; hg add dom/webidl/Browser.webidl;

cleanpatch:
	@cd mozilla; hg update -C; hg up -r $(TARGET_REV);

repatch: cleanpatch applypatch

mozconfig:
	echo '# SB Release Build' > $(MOZ_CONFIG);
  ifeq ($(OS_ARCH),Linux)
	echo '. $$topsrcdir/securebrowser/config/mozconfig.'$(OS_ARCH) >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
	echo '# . $$topsrcdir/securebrowser/config/mozconfig.'$(OS_ARCH)_64 >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
  else
    ifeq ($(OS_ARCH),Darwin)
	echo '. $$topsrcdir/securebrowser/config/mozconfig.'$(OS_ARCH).universal >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
    else
	echo '. $$topsrcdir/securebrowser/config/mozconfig.WINNT' >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
    endif
  endif
	echo '# SB Debug Build' >> $(MOZ_CONFIG);
  ifeq ($(OS_ARCH),Linux)
	echo '# . $$topsrcdir/securebrowser/config/mozconfig-debug.'$(OS_ARCH) >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
  else
    ifeq ($(OS_ARCH),Darwin)
	echo '# . $$topsrcdir/securebrowser/config/mozconfig-debug.'$(OS_ARCH).universal >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
    else
	echo '# . $$topsrcdir/securebrowser/config/mozconfig-debug.WINNT' >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
    endif
  endif
	echo '# Vanilla Firefox Release Build' >> $(MOZ_CONFIG);
  ifeq ($(OS_ARCH),Linux)
	echo '# . $$topsrcdir/browser/config/mozconfigs/linux32/release' >> $(MOZ_CONFIG);
  else
    ifeq ($(OS_ARCH),Darwin)
	echo '# . $$topsrcdir/browser/config/mozconfigs/macosx-universal/release' >> $(MOZ_CONFIG);
    else
	echo '# important comment out reference to "mozconfig.vs2013-win64" in win32/commmon-opt' >> $(MOZ_CONFIG);
	echo '# it has mozilla specific build paths that will break this build' >> $(MOZ_CONFIG);
	echo '# . $$topsrcdir/browser/config/mozconfigs/win32/nightly' >> $(MOZ_CONFIG);
    endif
  endif
	echo  '# mk_add_options MOZ_OBJDIR=@TOPSRCDIR@/../opt-vanilla-@CONFIG_GUESS@' >> $(MOZ_CONFIG);
	echo  '# ac_add_options --disable-tests' >> $(MOZ_CONFIG);

ifeq ($(OS_ARCH),Linux)
mozconfig-linux64:
	echo '# SB Linux 64 bit Release Build' > $(MOZ_CONFIG);
	echo '. $$topsrcdir/securebrowser/config/mozconfig.'$(OS_ARCH)_64 >> $(MOZ_CONFIG);
	echo  >> $(MOZ_CONFIG);
endif

hgignore:
	@echo securebrowser > mozilla/.hgignore

help:
	@echo "build targets: ";\
	echo ;\
	echo "    checkout mozilla-checkout bundle-checkout securebrowser-checkout securebrowser-checkout-prodBuild";\
	echo "    mozconfig mozconfig-linux64 applypatch repatch cleanpatch win32-dll-checkout hgignore"
	echo ;\

