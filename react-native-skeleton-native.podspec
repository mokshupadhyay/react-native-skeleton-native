require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "react-native-skeleton-native"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]
  s.platforms    = { :ios => (defined?(min_ios_version_supported) ? min_ios_version_supported : "13.0") }
  s.source       = { :git => package["repository"]["url"].sub(/^git\+/, ""), :tag => "v#{s.version}" }
  s.source_files = "ios/**/*.{h,m,mm}"
  s.frameworks   = "QuartzCore", "UIKit"

  # React Native 0.71+ (the supported range): adds React-Core, the codegen
  # output for the components in src/specs and the New Architecture flags.
  install_modules_dependencies(s)
end
