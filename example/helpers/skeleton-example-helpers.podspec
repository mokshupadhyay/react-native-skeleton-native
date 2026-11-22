Pod::Spec.new do |s|
  s.name         = "skeleton-example-helpers"
  s.version      = "0.0.0"
  s.summary      = "Example-only main-thread blocker."
  s.homepage     = "https://github.com/mokshupadhyay/react-native-skeleton-native"
  s.license      = "MIT"
  s.authors      = "example"
  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :path => "." }
  s.source_files = "ios/**/*.{h,m,mm}"
  install_modules_dependencies(s)
end
