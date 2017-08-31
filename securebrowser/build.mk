# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

installer:
	@$(MAKE) -C securebrowser/installer installer

package:
	@$(MAKE) -C securebrowser/installer

package-compare:
	@$(MAKE) -C securebrowser/installer package-compare

stage-package:
	@$(MAKE) -C securebrowser/installer stage-package

sdk:
	@$(MAKE) -C securebrowser/installer make-sdk

install::
	@$(MAKE) -C securebrowser/installer install

clean::
	@$(MAKE) -C securebrowser/installer clean

distclean::
	@$(MAKE) -C securebrowser/installer distclean

source-package::
	@$(MAKE) -C securebrowser/installer source-package

upload::
	@$(MAKE) -C securebrowser/installer upload

source-upload::
	@$(MAKE) -C securebrowser/installer source-upload

hg-bundle::
	@$(MAKE) -C securebrowser/installer hg-bundle

l10n-check::
	@$(MAKE) -C browser/locales l10n-check

ifdef ENABLE_TESTS
# Implemented in testing/testsuite-targets.mk

mochitest-browser-chrome:
	$(RUN_MOCHITEST) --flavor=browser
	$(CHECK_TEST_ERROR)

mochitest:: mochitest-browser-chrome

.PHONY: mochitest-browser-chrome

endif
