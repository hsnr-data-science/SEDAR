c = get_config()

c.NotebookApp.tornado_settings = {
    'headers': {
        'Content-Security-Policy': "frame-ancestors 'self' http://127.0.0.1"
    }
}
#--no-browser
#c.NotebookApp.open_browser = False
#c.NotebookApp.disable_check_xsrf=True 
#c.NotebookApp.allow_origin='*'
#c.NotebookApp.allow_remote_access=True
#c.NotebookApp.tornado_settings='{\"headers\":{\"Content-Security-Policy\":\"frame-ancestors self *; report-uri /api/security/csp-report\"}}'
#c.NotebookApp.token=''


