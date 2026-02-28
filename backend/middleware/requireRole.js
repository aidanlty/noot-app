const requireRole = (supabase, allowedRoles) => {
    return async (req, res, next) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '')
            const { data: { user }, error: authError } = await supabase.auth.getUser(token)
            if (authError || !user) return res.status(401).json({ message: 'Not authenticated' })

            const { data: profile, error: profileError } = await supabase
                .from('Profiles')
                .select('"Role"')
                .eq('"Email"', user.email)
                .single()

            if (profileError || !profile) return res.status(401).json({ message: 'Profile not found' })

            if (!allowedRoles.includes(profile.Role)) {
                return res.status(403).json({ message: `Access restricted to: ${allowedRoles.join(', ')}` })
            }

            req.user = user
            req.profile = profile
            next()
        } catch (err) {
            res.status(500).json({ error: err.message })
        }
    }
}

module.exports = requireRole